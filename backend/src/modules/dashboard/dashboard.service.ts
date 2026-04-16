import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';
import { CampaignStatus, AdPlatform, Prisma, UserRole } from '@prisma/client';
import {
  PeriodEnum,
  DashboardOverviewResponseDto,
  GetDashboardOverviewDto,
} from './dto/dashboard-overview.dto';
import { ProvenanceMode } from '../../common/provenance.constants';

// ============================================================
// Helper: Safe Decimal to Number conversion with null coalescing
// ============================================================

/**
 * Safely converts Prisma Decimal | null | number to native JS number.
 * Handles null/undefined by returning defaultValue (default: 0).
 */
function toNumber(value: Prisma.Decimal | number | string | null | undefined, defaultValue = 0): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
  }
  // Prisma.Decimal has toNumber() method, native number does not
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  return Number(value);
}

/**
 * Decide whether the date range should fallback to mock data.
 * For Today (1d), use mock data only if no real metrics exist.
 */
async function shouldUseMockFallback(
  prisma: PrismaService,
  tenantId: string,
  startDate: Date,
  endDate: Date,
  hideMockData: boolean,
  platform?: AdPlatform,
): Promise<boolean> {
  if (hideMockData) return false;

  const where: Prisma.MetricWhereInput = {
    tenantId,
    date: {
      gte: startDate,
      lte: endDate,
    },
    isMockData: false,
  };

  if (platform) {
    where.platform = platform;
  }

  const realMetric = await prisma.metric.findFirst({ where });
  return !realMetric;
}

function buildMetricWhere(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  hideMockData: boolean,
  useMockFallback: boolean,
  platform?: AdPlatform,
): Prisma.MetricWhereInput {
  const where: Prisma.MetricWhereInput = {
    tenantId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (platform) {
    where.platform = platform;
  }

  if (hideMockData || !useMockFallback) {
    where.isMockData = false;
  }

  return where;
}

function getUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTodayMockMetricPayload(
  tenantId: string,
  campaignId: string,
  platform: AdPlatform,
  date: Date,
) {
  const impressions = getRandomInt(2000, 6000);
  const clicks = Math.max(1, Math.floor(impressions * (0.02 + Math.random() * 0.06)));
  const conversions = Math.max(0, Math.floor(clicks * (0.04 + Math.random() * 0.08)));
  const spend = parseFloat((getRandomInt(150, 900) + Math.random()).toFixed(2));
  const revenue = parseFloat((conversions * (50 + Math.random() * 150)).toFixed(2));
  const roas = spend > 0 ? parseFloat((revenue / spend).toFixed(4)) : 0;
  const ctr = parseFloat(((clicks / impressions) * 100).toFixed(4));
  const costPerClick = spend > 0 ? parseFloat((spend / clicks).toFixed(4)) : 0;
  const costPerMille = impressions > 0 ? parseFloat(((spend / impressions) * 1000).toFixed(4)) : 0;
  const conversionRate = clicks > 0 ? parseFloat(((conversions / clicks) * 100).toFixed(4)) : 0;
  const bounceRate = parseFloat((0.45 + Math.random() * 0.25).toFixed(4));
  const avgSessionDuration = getRandomInt(60, 240);

  return {
    tenantId,
    campaignId,
    platform,
    date,
    source: 'mock',
    impressions,
    clicks,
    conversions,
    spend,
    revenue,
    roas,
    costPerClick,
    costPerMille,
    costPerAction: 0,
    ctr,
    conversionRate,
    averageOrderValue: 0,
    cartAbandonmentRate: 0,
    organicTraffic: getRandomInt(0, 200),
    bounceRate,
    avgSessionDuration,
    isMockData: true,
  } as const;
}

async function ensureTodayMockMetrics(prisma: PrismaService, tenantId: string) {
  const todayUtc = getUtcMidnight(new Date());

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId },
    select: { id: true, platform: true },
  });

  if (!campaigns.length) {
    return;
  }

  for (const campaign of campaigns) {
    const existingMock = await prisma.metric.findFirst({
      where: {
        tenantId,
        campaignId: campaign.id,
        date: todayUtc,
        isMockData: true,
      },
    });

    if (!existingMock) {
      const payload = generateTodayMockMetricPayload(
        tenantId,
        campaign.id,
        campaign.platform,
        todayUtc,
      );
      await prisma.metric.create({ data: payload });
    }
  }
}

/**
 * DashboardService - Clean version following Seed Pattern
 * 
 * This service ONLY reads from database.
 * Mock data is seeded by MockDataSeederService during sync, NOT generated on-the-fly.
 */
@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async getSummary(tenantId: string, days: number = 30, MOCK?: ProvenanceMode) {
    const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
    const { startDate: currentStartDate, endDate: today } = DateRangeUtil.getDateRange(days);
    const { startDate: previousStartDate } = DateRangeUtil.getPreviousPeriodDateRange(currentStartDate, days);
    const useMockCurrent = days === 1 && await shouldUseMockFallback(this.prisma, tenantId, currentStartDate, today, hideMockData);
    const useMockPrevious = days === 1 && await shouldUseMockFallback(this.prisma, tenantId, previousStartDate, currentStartDate, hideMockData);

    // Get campaigns
    const totalCampaigns = await this.prisma.campaign.count({
      where: { tenantId },
    });
    const activeCampaigns = await this.prisma.campaign.count({
      where: {
        tenantId,
        status: CampaignStatus.ACTIVE
      },
    });

    // Get previous period for comparison
    const previousTotalCampaigns = await this.prisma.campaign.count({
      where: {
        tenantId,
        createdAt: {
          lte: currentStartDate,
        },
      },
    });

    // Get metrics for current period (from DB - seeded or real)
    const currentMetrics = await this.prisma.metric.aggregate({
      where: buildMetricWhere(tenantId, currentStartDate, today, hideMockData, useMockCurrent),
      _sum: {
        impressions: true,
        clicks: true,
        spend: true,
        conversions: true,
      },
    });

    // Get metrics for previous period (for trend calculation)
    const previousMetrics = await this.prisma.metric.aggregate({
      where: buildMetricWhere(tenantId, previousStartDate, currentStartDate, hideMockData, useMockPrevious),
      _sum: {
        impressions: true,
        clicks: true,
        spend: true,
        conversions: true,
      },
    });

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // Check if any of the metrics are mock data
    const hasMockData = !hideMockData
      ? days === 1
        ? useMockCurrent
          ? !!(await this.prisma.metric.findFirst({
              where: {
                tenantId,
                date: {
                  gte: currentStartDate,
                  lte: today,
                },
                isMockData: true,
              },
            }))
          : false
        : !!(await this.prisma.metric.findFirst({
            where: {
              tenantId,
              date: {
                gte: currentStartDate,
                lte: today,
              },
              isMockData: true,
            },
          }))
      : false;

    return {
      totalCampaigns,
      activeCampaigns,
      totalSpend: toNumber(currentMetrics._sum.spend),
      totalImpressions: currentMetrics._sum.impressions ?? 0,
      totalClicks: currentMetrics._sum.clicks ?? 0,
      totalConversions: currentMetrics._sum.conversions ?? 0,
      isMockData: !hideMockData && !!hasMockData,
      trends: {
        campaigns: calculateTrend(totalCampaigns, previousTotalCampaigns),
        spend: calculateTrend(
          toNumber(currentMetrics._sum.spend),
          toNumber(previousMetrics._sum.spend),
        ),
        impressions: calculateTrend(
          currentMetrics._sum.impressions ?? 0,
          previousMetrics._sum.impressions ?? 0,
        ),
        clicks: calculateTrend(
          currentMetrics._sum.clicks ?? 0,
          previousMetrics._sum.clicks ?? 0,
        ),
      },
    };
  }

  /**
   * Get summary metrics filtered by platform
   * @param platform - 'ALL' | 'GOOGLE_ADS' | 'FACEBOOK' | 'TIKTOK' | 'LINE_ADS'
   */
  async getSummaryByPlatform(tenantId: string, days: number = 30, platform: string = 'ALL') {
    const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
    const { startDate: currentStartDate, endDate: today } = DateRangeUtil.getDateRange(days);
    const { startDate: previousStartDate } = DateRangeUtil.getPreviousPeriodDateRange(currentStartDate, days);

    // Normalize platform input to match Enum
    if (platform !== 'ALL') {
      platform = platform.toUpperCase().replace('-', '_');
      if (platform === 'GOOGLE') platform = 'GOOGLE_ADS';
      if (platform === 'LINE') platform = 'LINE_ADS';
    }

    const platformFilter: AdPlatform | undefined = platform === 'ALL' ? undefined : (platform as AdPlatform);
    const platformEnum = platformFilter as AdPlatform;
    const useMockCurrent = days === 1 && await shouldUseMockFallback(this.prisma, tenantId, currentStartDate, today, hideMockData, platformFilter);
    const useMockPrevious = days === 1 && await shouldUseMockFallback(this.prisma, tenantId, previousStartDate, currentStartDate, hideMockData, platformFilter);

    // Campaign counts:
    // - For most platforms, campaigns are stored on Campaign.platform.
    // - For INSTAGRAM, Campaign.platform remains FACEBOOK (Meta), while Metric.platform is INSTAGRAM.
    let totalCampaigns = 0;
    let activeCampaigns = 0;

    if (platform === 'ALL') {
      totalCampaigns = await this.prisma.campaign.count({ where: { tenantId } });
      activeCampaigns = await this.prisma.campaign.count({ where: { tenantId, status: CampaignStatus.ACTIVE } });
    } else if (platformEnum === ('INSTAGRAM' as any as AdPlatform)) {
      const campaignIds = await this.prisma.metric.groupBy({
        by: ['campaignId'],
        where: {
          tenantId,
          platform: 'INSTAGRAM' as any,
          date: { gte: currentStartDate, lte: today },
        },
      });
      const ids = campaignIds.map((c) => c.campaignId);
      totalCampaigns = ids.length;
      activeCampaigns = ids.length
        ? await this.prisma.campaign.count({
          where: { tenantId, status: CampaignStatus.ACTIVE, id: { in: ids } },
        })
        : 0;
    } else {
      totalCampaigns = await this.prisma.campaign.count({
        where: { tenantId, platform: platformEnum },
      });
      activeCampaigns = await this.prisma.campaign.count({
        where: { tenantId, status: CampaignStatus.ACTIVE, platform: platformEnum },
      });
    }

    // Get metrics for current period
    const currentMetrics = await this.prisma.metric.aggregate({
      where: buildMetricWhere(
        tenantId,
        currentStartDate,
        today,
        hideMockData,
        useMockCurrent,
        platformFilter,
      ),
      _sum: { impressions: true, clicks: true, spend: true, conversions: true },
    });

    // Get metrics for previous period
    const previousMetrics = await this.prisma.metric.aggregate({
      where: buildMetricWhere(
        tenantId,
        previousStartDate,
        currentStartDate,
        hideMockData,
        useMockPrevious,
        platformFilter,
      ),
      _sum: { impressions: true, clicks: true, spend: true, conversions: true },
    });

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    // Check if mock data
    const hasMockData = !hideMockData
      ? days === 1
        ? useMockCurrent
          ? await this.prisma.metric.findFirst({
              where: {
                tenantId,
                date: { gte: currentStartDate, lte: today },
                ...(platform !== 'ALL' ? { platform: platformEnum } : {}),
                isMockData: true,
              },
            })
          : null
        : await this.prisma.metric.findFirst({
            where: {
              tenantId,
              date: { gte: currentStartDate, lte: today },
              ...(platform !== 'ALL' ? { platform: platformEnum } : {}),
              isMockData: true,
            },
          })
      : null;

    return {
      platform,
      totalCampaigns,
      activeCampaigns,
      totalSpend: toNumber(currentMetrics._sum.spend),
      totalImpressions: currentMetrics._sum.impressions ?? 0,
      totalClicks: currentMetrics._sum.clicks ?? 0,
      totalConversions: currentMetrics._sum.conversions ?? 0,
      isMockData: !hideMockData && !!hasMockData,
      trends: {
        spend: calculateTrend(
          toNumber(currentMetrics._sum.spend),
          toNumber(previousMetrics._sum.spend),
        ),
        impressions: calculateTrend(
          currentMetrics._sum.impressions ?? 0,
          previousMetrics._sum.impressions ?? 0,
        ),
        clicks: calculateTrend(
          currentMetrics._sum.clicks ?? 0,
          previousMetrics._sum.clicks ?? 0,
        ),
      },
    };
  }

  async getTopCampaigns(tenantId: string, limit = 5, days = 30) {
    const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
    const { startDate, endDate: today } = DateRangeUtil.getDateRange(days);

    // 1. Aggregate metrics by campaignId using Database GroupBy
    const useMockTopCampaigns = days === 1 && await shouldUseMockFallback(this.prisma, tenantId, startDate, today, hideMockData);
    const aggregatedMetrics = await this.prisma.metric.groupBy({
      by: ['campaignId'],
      where: buildMetricWhere(tenantId, startDate, today, hideMockData, useMockTopCampaigns),
      _sum: {
        impressions: true,
        clicks: true,
        spend: true,
        conversions: true,
        revenue: true,
      },
      orderBy: {
        _sum: {
          spend: 'desc',
        },
      },
      take: limit,
    });

    // 2. Fetch Campaign Details for the top campaigns
    const campaignIds = aggregatedMetrics.map(m => m.campaignId);
    const campaigns = await this.prisma.campaign.findMany({
      where: { id: { in: campaignIds }, tenantId },
      select: { id: true, name: true, platform: true, status: true },
    });

    const campaignMap = new Map(campaigns.map(c => [c.id, c]));

    // 3. Combine Data
    return aggregatedMetrics.map(m => {
      const campaign = campaignMap.get(m.campaignId);
      const totals = m._sum;
      const spend = toNumber(totals.spend);
      const revenue = toNumber(totals.revenue);
      const impressions = totals.impressions ?? 0;
      const clicks = totals.clicks ?? 0;

      return {
        id: m.campaignId,
        name: campaign?.name || 'Unknown',
        platform: campaign?.platform || 'UNKNOWN',
        status: campaign?.status || 'UNKNOWN',
        metrics: {
          impressions,
          clicks,
          spend,
          conversions: totals.conversions ?? 0,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        },
      };
    });
  }

  async getTrends(tenantId: string, days = 30) {
    const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
    const { startDate, endDate: today } = DateRangeUtil.getDateRange(days);

    const useMockTrends = days === 1 && await shouldUseMockFallback(this.prisma, tenantId, startDate, today, hideMockData);
    const metrics = await this.prisma.metric.groupBy({
      by: ['date'],
      where: buildMetricWhere(tenantId, startDate, today, hideMockData, useMockTrends),
      _sum: {
        impressions: true,
        clicks: true,
        spend: true,
        conversions: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return metrics.map((m) => ({
      date: m.date,
      impressions: m._sum.impressions ?? 0,
      clicks: m._sum.clicks ?? 0,
      spend: toNumber(m._sum.spend),
      conversions: m._sum.conversions ?? 0,
    }));
  }
  async getOnboardingStatus(tenantId: string) {
    // 1. Check Google Ads Connection
    const googleAdsCount = await this.prisma.googleAdsAccount.count({
      where: { tenantId, status: 'ENABLED' },
    });

    // 2. Check GA4 Connection
    const ga4Count = await this.prisma.googleAnalyticsAccount.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    // 3. Check KPI Targets (in Tenant settings)
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    let hasTargets = false;
    if (tenant?.settings) {
      try {
        // Handle both string and object JSON values
        const settings = typeof tenant.settings === 'string'
          ? JSON.parse(tenant.settings as string)
          : tenant.settings;
        hasTargets = !!settings?.kpiTargets;
      } catch (e) {
        // Invalid JSON
      }
    }

    // 4. Check Team Members (User count > 1)
    const userCount = await this.prisma.user.count({
      where: { tenantId },
    });

    return {
      googleAds: googleAdsCount > 0,
      googleAnalytics: ga4Count > 0,
      kpiTargets: hasTargets,
      teamMembers: userCount > 1,
    };
  }

  async getAdsConnections(tenantId: string): Promise<{
    google: boolean;
    facebook: boolean;
    tiktok: boolean;
    line: boolean;
  }> {
    const [googleCount, facebookCount, tiktokCount, lineCount] = await Promise.all([
      this.prisma.googleAdsAccount.count({
        where: { tenantId, status: 'ENABLED' },
      }),
      this.prisma.facebookAdsAccount.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.tikTokAdsAccount.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.lineAdsAccount.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
    ]);

    return {
      google: googleCount > 0,
      facebook: facebookCount > 0,
      tiktok: tiktokCount > 0,
      line: lineCount > 0,
    };
  }

  async getPerformanceByPlatform(tenantId: string, days = 30, REAL?: ProvenanceMode) {
    const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
    const { startDate, endDate: today } = DateRangeUtil.getDateRange(days);
    const useMockPerformance = days === 1 && await shouldUseMockFallback(this.prisma, tenantId, startDate, today, hideMockData);

    const platformMetrics = await this.prisma.metric.groupBy({
      by: ['platform'],
      where: buildMetricWhere(tenantId, startDate, today, hideMockData, useMockPerformance),
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
    });

    const platformData: Record<string, { spend: number; impressions: number; clicks: number; conversions: number }> = {
      GOOGLE_ADS: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
      FACEBOOK: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
      INSTAGRAM: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
      TIKTOK: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
      LINE_ADS: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
    };

    for (const m of platformMetrics) {
      const key = String(m.platform);
      if (platformData[key]) {
        platformData[key].spend += toNumber(m._sum.spend);
        platformData[key].impressions += m._sum.impressions ?? 0;
        platformData[key].clicks += m._sum.clicks ?? 0;
        platformData[key].conversions += m._sum.conversions ?? 0;
      }
    }

    // 2. Get GA4 Metrics (WebAnalyticsDaily)
    const ga4Metrics = await this.prisma.webAnalyticsDaily.aggregate({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: today,
        },
        ...(hideMockData ? { isMockData: false } : {}),
        // Include all data (real + mock)
      },
      _sum: {
        sessions: true,
        activeUsers: true,
        newUsers: true,
        screenPageViews: true,
      },
    });

    // 3. Format Response
    return [
      {
        platform: 'GOOGLE_ADS',
        spend: platformData.GOOGLE_ADS.spend,
        impressions: platformData.GOOGLE_ADS.impressions,
        clicks: platformData.GOOGLE_ADS.clicks,
        conversions: platformData.GOOGLE_ADS.conversions,
      },
      {
        platform: 'FACEBOOK',
        spend: platformData.FACEBOOK.spend,
        impressions: platformData.FACEBOOK.impressions,
        clicks: platformData.FACEBOOK.clicks,
        conversions: platformData.FACEBOOK.conversions,
      },
      {
        platform: 'INSTAGRAM',
        spend: platformData.INSTAGRAM.spend,
        impressions: platformData.INSTAGRAM.impressions,
        clicks: platformData.INSTAGRAM.clicks,
        conversions: platformData.INSTAGRAM.conversions,
      },
      {
        platform: 'TIKTOK',
        spend: platformData.TIKTOK.spend,
        impressions: platformData.TIKTOK.impressions,
        clicks: platformData.TIKTOK.clicks,
        conversions: platformData.TIKTOK.conversions,
      },
      {
        platform: 'LINE_ADS',
        spend: platformData.LINE_ADS.spend,
        impressions: platformData.LINE_ADS.impressions,
        clicks: platformData.LINE_ADS.clicks,
        conversions: platformData.LINE_ADS.conversions,
      },
      {
        platform: 'GOOGLE_ANALYTICS',
        spend: 0, // GA4 doesn't track spend directly here
        impressions: ga4Metrics._sum.screenPageViews || 0, // Proxy for impressions
        clicks: ga4Metrics._sum.sessions || 0, // Proxy for clicks/visits
        conversions: 0, // Could map key events if available
      },
    ];
  }

  // ============================================================
  // Dashboard Overview (API Spec v1.0)
  // ============================================================

  /**
   * Get dashboard overview data
   * Following API Spec: GET /api/v1/dashboard/overview
   */
  async getOverview(
    user: { tenantId: string; role: UserRole },
    query: GetDashboardOverviewDto,
  ): Promise<DashboardOverviewResponseDto> {
    const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
    // Security: Force tenantId from JWT unless SUPER_ADMIN
    let tenantId = user.tenantId;
    if (query.tenantId) {
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Tenant override requires SUPER_ADMIN role');
      }
      tenantId = query.tenantId;
    }

    let startDate: Date;
    let endDate: Date;
    let period: PeriodEnum;

    // Check if custom date range is provided
    if (query.startDate && query.endDate) {
      // Use custom date range
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);

      // Validate date range
      if (startDate > endDate) {
        throw new Error('startDate must be before or equal to endDate');
      }

      // Use the provided period or default for metadata
      period = query.period || PeriodEnum.SEVEN_DAYS;
    } else {
      // Use period-based date range (existing logic)
      period = query.period || PeriodEnum.SEVEN_DAYS;
      const dateRange = DateRangeUtil.getDateRangeByPeriod(period);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    // Get previous period for comparison
    const previousPeriod = DateRangeUtil.getPreviousPeriodByPeriod(period, startDate, endDate);
    const useMockCurrent = period === PeriodEnum.ONE_DAY && !hideMockData;
    const useMockPrevious = period === PeriodEnum.ONE_DAY && await shouldUseMockFallback(this.prisma, tenantId, previousPeriod.startDate, previousPeriod.endDate, hideMockData);

    if (useMockCurrent) {
      await ensureTodayMockMetrics(this.prisma, tenantId);
    }

    // 1. Get current period metrics
    const currentMetrics = await this.prisma.metric.aggregate({
      where: buildMetricWhere(tenantId, startDate, endDate, hideMockData, useMockCurrent),
      _sum: {
        impressions: true,
        clicks: true,
        spend: true,
        conversions: true,
        revenue: true,
      },
    });

    // 2. Get previous period metrics for growth
    const previousMetrics = await this.prisma.metric.aggregate({
      where: buildMetricWhere(tenantId, previousPeriod.startDate, previousPeriod.endDate, hideMockData, useMockPrevious),
      _sum: {
        impressions: true,
        clicks: true,
        spend: true,
        conversions: true,
        revenue: true,
      },
    });

    // 3. Get daily trends
    const dailyMetrics = await this.prisma.metric.groupBy({
      by: ['date'],
      where: buildMetricWhere(tenantId, startDate, endDate, hideMockData, useMockCurrent),
      _sum: {
        impressions: true,
        clicks: true,
        spend: true,
        conversions: true,
      },
      orderBy: { date: 'asc' },
    });

    // 4. Get recent campaigns with spending
    // 4. Get recent campaigns with spending (REFACTORED for performance & reliability)
    // Instead of fetching ALL campaigns and filtering relation, use metric aggregation

    // Step A: Find top 5 campaigns by spend in this period
    const topCampaignMetrics = await this.prisma.metric.groupBy({
      by: ['campaignId'],
      where: {
        ...buildMetricWhere(tenantId, startDate, endDate, hideMockData, useMockCurrent),
        campaign: { tenantId },
      },
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
      orderBy: {
        _sum: { spend: 'desc' }
      },
      take: 5
    });

    // Step B: Fetch campaign details for these IDs
    const campaignIds = topCampaignMetrics.map(m => m.campaignId);

    // If no metrics found, fetch latest created campaigns as fallback
    let campaignDetails: Array<{ id: string; name: string; status: any; platform: any; budget: any }> = [];

    if (campaignIds.length > 0) {
      campaignDetails = await this.prisma.campaign.findMany({
        where: { id: { in: campaignIds }, tenantId },
        select: { id: true, name: true, status: true, platform: true, budget: true }
      });
    } else {
      // Fallback: 5 most recently updated campaigns
      campaignDetails = await this.prisma.campaign.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, status: true, platform: true, budget: true }
      });
    }

    const campaignMap = new Map(campaignDetails.map(c => [c.id, c]));

    // Step C: Combine data
    // If we have metric data, use it. If fallback, metrics are 0.
    const recentCampaigns = campaignIds.length > 0
      ? topCampaignMetrics.map(m => {
        const c = campaignMap.get(m.campaignId);
        if (!c) return null; // Should not happen if referential integrity holds

        const spending = toNumber(m._sum.spend);
        const budget = Number(c.budget) || 0;

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          platform: c.platform,
          spending,
          impressions: m._sum.impressions || 0,
          clicks: m._sum.clicks || 0,
          conversions: toNumber(m._sum.conversions),
          budgetUtilization: budget > 0 ? (spending / budget) * 100 : 0,
        };
      }).filter(Boolean)
      : campaignDetails.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        platform: c.platform,
        spending: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        budgetUtilization: 0
      }));

    // 5. Calculate Summary Metrics
    const totalCost = toNumber(currentMetrics._sum.spend);
    const totalImpressions = currentMetrics._sum.impressions ?? 0;
    const totalClicks = currentMetrics._sum.clicks ?? 0;
    const totalConversions = currentMetrics._sum.conversions ?? 0;
    const totalRevenue = toNumber(currentMetrics._sum.revenue);

    const summary = {
      totalCost,
      totalImpressions,
      totalClicks,
      totalConversions,
      averageRoas: totalCost > 0 ? totalRevenue / totalCost : 0,
      averageCpm: totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0,
      averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      averageRoi: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0,
    };

    // 6. Calculate Growth (Trends)
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const previousCost = toNumber(previousMetrics._sum.spend);
    const previousImpressions = previousMetrics._sum.impressions ?? 0;
    const previousClicks = previousMetrics._sum.clicks ?? 0;
    const previousConversions = previousMetrics._sum.conversions ?? 0;
    const previousRevenue = toNumber(previousMetrics._sum.revenue);

    const prevRoas = previousCost > 0 ? previousRevenue / previousCost : 0;
    const prevCpm = previousImpressions > 0 ? (previousCost / previousImpressions) * 1000 : 0;
    const prevCtr = previousImpressions > 0 ? (previousClicks / previousImpressions) * 100 : 0;
    const prevRoi = previousCost > 0 ? ((previousRevenue - previousCost) / previousCost) * 100 : 0;

    const growth = {
      costGrowth: calculateTrend(totalCost, previousCost),
      impressionsGrowth: calculateTrend(totalImpressions, previousImpressions),
      clicksGrowth: calculateTrend(totalClicks, previousClicks),
      conversionsGrowth: calculateTrend(totalConversions, previousConversions),
      roasGrowth: calculateTrend(summary.averageRoas, prevRoas),
      cpmGrowth: calculateTrend(summary.averageCpm, prevCpm),
      ctrGrowth: calculateTrend(summary.averageCtr, prevCtr),
      roiGrowth: calculateTrend(summary.averageRoi, prevRoi),
    };

    // Check if the current response is using mock data for Today
    const hasMockData = !hideMockData && period === PeriodEnum.ONE_DAY && useMockCurrent && !!(await this.prisma.metric.findFirst({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
        isMockData: true,
      },
    }));

    // 7. Format Trends (Daily)
    const trends = dailyMetrics.map(m => ({
      date: m.date.toISOString().split('T')[0],
      cost: toNumber(m._sum.spend),
      impressions: m._sum.impressions ?? 0,
      clicks: m._sum.clicks ?? 0,
      conversions: m._sum.conversions ?? 0,
    }));

    // 8. Platform Breakdown
    const platformBreakdownGroup = await this.prisma.metric.groupBy({
      by: ['platform'],
      where: buildMetricWhere(tenantId, startDate, endDate, hideMockData, useMockCurrent),
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
    });

    const platformBreakdown = platformBreakdownGroup.map(m => ({
      platform: m.platform,
      spend: toNumber(m._sum.spend),
      impressions: m._sum.impressions ?? 0,
      clicks: m._sum.clicks ?? 0,
      conversions: m._sum.conversions ?? 0,
    }));

    return {
      success: true,
      data: {
        summary,
        growth,
        trends,
        platformBreakdown,
        recentCampaigns,
        isDemo: hasMockData,
      },
      meta: {
        period,
        dateRange: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
        },
        tenantId,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
