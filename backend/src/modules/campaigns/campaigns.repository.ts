import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignsDto } from './dto';
import { Campaign, Metric, Prisma, CampaignStatus, AdPlatform } from '@prisma/client';

export abstract class CampaignsRepository {
  abstract create(tenantId: string, data: CreateCampaignDto): Promise<Campaign & { metrics: Metric[] }>;
  abstract findAll(tenantId: string, query: QueryCampaignsDto): Promise<[(Campaign & { metrics: Metric[] })[], number]>;
  abstract findOne(tenantId: string, id: string): Promise<(Campaign & { metrics: Metric[] }) | null>;
  abstract update(tenantId: string, id: string, data: any): Promise<Campaign & { metrics: Metric[] }>;
  abstract remove(tenantId: string, id: string): Promise<void>;
  abstract getMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<Metric[]>;
  abstract getSummary(tenantId: string, query: QueryCampaignsDto): Promise<any>;
}

@Injectable()
export class PrismaCampaignsRepository implements CampaignsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(tenantId: string, dto: CreateCampaignDto): Promise<Campaign & { metrics: Metric[] }> {
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        platform: dto.platform,
        status: dto.status || CampaignStatus.PENDING,
        budget: dto.budget,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        externalId: dto.externalId || null,
        tenantId,
      },
      include: { metrics: true },
    });
  }

  // ==========================================================================
  // Helper: Build Where Clause
  // ==========================================================================
  private buildWhereClause(tenantId: string, query: QueryCampaignsDto): Prisma.CampaignWhereInput {
    const search = query.search || undefined;

    // Handle multi-select Status
    let statusFilter: Prisma.EnumCampaignStatusFilter | undefined;
    if (query.status && query.status !== 'ALL') {
      const statuses = query.status.split(',').filter(s => s !== 'ALL') as CampaignStatus[];
      if (statuses.length > 0) {
        statusFilter = statuses.length === 1 ? { equals: statuses[0] } : { in: statuses };
      }
    }

    // Handle multi-select Platform
    let platformFilter: Prisma.EnumAdPlatformFilter | undefined;

    // DEBUG LOG
    if (query.platform) {
      console.log('DEBUG: buildWhereClause platform input:', query.platform);
      console.log('DEBUG: AdPlatform Enum Keys/Values:', JSON.stringify(AdPlatform));
    }

    if (query.platform && query.platform !== 'ALL') {
      const platforms = query.platform.split(',').filter(p => p !== 'ALL').map(p => {
        const key = p.trim().toUpperCase().replace('-', '_');

        // Explicit mapping for known variations
        if (key === 'GOOGLE') return AdPlatform.GOOGLE_ADS;
        if (key === 'LINE') return AdPlatform.LINE_ADS;

        // Check if key exists in Enum, otherwise attempt as-is (though likely invalid)
        if (key in AdPlatform) {
          return AdPlatform[key as keyof typeof AdPlatform];
        }

        // Fallback: return the uppercased key which matches standard Prisma Enum Keys
        return key as AdPlatform;
      }) as AdPlatform[];

      if (platforms.length > 0) {
        platformFilter = platforms.length === 1 ? { equals: platforms[0] } : { in: platforms };
      }
    }

    const ids = query.ids ? query.ids.split(',').filter(id => id.trim().length > 0) : undefined;

    const where: Prisma.CampaignWhereInput = { tenantId };

    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { externalId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (platformFilter) {
      where.platform = platformFilter;
    }

    return where;
  }

  async findAll(tenantId: string, query: QueryCampaignsDto): Promise<[(Campaign & { metrics: Metric[] })[], number]> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    let endDate = query.endDate ? new Date(query.endDate) : undefined;
    // Set endDate to end-of-day (23:59:59) to include all records for that day
    if (endDate) {
      endDate.setUTCHours(23, 59, 59, 999);
    }

    const where = this.buildWhereClause(tenantId, query);

    const take = limit;
    const skip = (page - 1) * take;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    // Whitelist of valid database fields for sorting
    const validSortFields = ['name', 'status', 'platform', 'budget', 'startDate', 'endDate', 'createdAt', 'updatedAt'];
    const orderBy: any = {};

    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      // If it's a calculated field (spend, revenue, roi, etc.), default to createdAt for DB query
      // and let the frontend or service layer handle it if needed
      orderBy['createdAt'] = 'desc';
    }

    // 1. Fetch campaigns with date-filtered metrics
    const [rawCampaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        take,
        skip,
        include: {
          metrics: {
            where: (startDate || endDate) ? {
              date: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate })
              }
            } : undefined
          }
        },
        orderBy,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    // 2. Fetch lifetime metrics total (no date filter) for each campaign in the result set
    // 2. Fetch lifetime metrics total for each campaign
    // We prioritize the 'lifetime_summary' source row which contains absolute totals from platforms
    const campaignIds = rawCampaigns.map(c => c.id);
    const summaryRows = await this.prisma.metric.findMany({
      where: {
        campaignId: { in: campaignIds },
        source: 'lifetime_summary'
      }
    });

    // If summary rows are missing for some campaigns, we fall back to summing the available daily metrics
    const missingIds = campaignIds.filter(id => !summaryRows.find(s => s.campaignId === id));
    let fallbackSums: any = [];
    if (missingIds.length > 0) {
      fallbackSums = await this.prisma.metric.groupBy({
        by: ['campaignId'],
        where: { campaignId: { in: missingIds }, source: { not: 'lifetime_summary' } },
        _sum: { spend: true, impressions: true, clicks: true, revenue: true, conversions: true }
      });
    }

    const lifetimeMap = new Map();
    // 1. Fill from summary rows (Precise totals from API)
    summaryRows.forEach(s => {
      lifetimeMap.set(s.campaignId, {
        spend: s.spend, impressions: s.impressions, clicks: s.clicks, revenue: s.revenue, conversions: s.conversions
      });
    });
    // 2. Fill from fallback sums (Aggregated from DB)
    fallbackSums.forEach(s => {
      if (!lifetimeMap.has(s.campaignId)) {
        lifetimeMap.set(s.campaignId, s._sum);
      }
    });

    // 3. Attach lifetime metrics to the campaigns
    const campaignsWithLifetime = rawCampaigns.map(c => {
      const lifetime = lifetimeMap.get(c.id);
      return {
        ...c,
        lifetimeSpend: lifetime?.spend || new Prisma.Decimal(0),
        lifetimeImpressions: lifetime?.impressions || 0,
        lifetimeClicks: lifetime?.clicks || 0,
        lifetimeRevenue: lifetime?.revenue || new Prisma.Decimal(0),
        lifetimeConversions: lifetime?.conversions || 0,
      };
    });

    return [campaignsWithLifetime as any, total];
  }

  async findOne(tenantId: string, id: string): Promise<(Campaign & { metrics: Metric[] }) | null> {
    return this.prisma.campaign.findFirst({
      where: { id, tenantId },
      include: { metrics: true },
    });
  }

  async update(tenantId: string, id: string, data: any): Promise<Campaign & { metrics: Metric[] }> {
    await this.prisma.campaign.updateMany({
      where: { id, tenantId },
      data,
    });

    // Fetch the updated record with metrics (tenant-scoped)
    return this.prisma.campaign.findFirstOrThrow({
      where: { id, tenantId },
      include: { metrics: true },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.campaign.deleteMany({
      where: { id, tenantId },
    });
  }

  async getMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<Metric[]> {
    const where: Prisma.MetricWhereInput = { campaignId };

    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    return this.prisma.metric.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  // ==========================================================================
  // New Method: Get Global Summary (Aggregated)
  // ==========================================================================
  async getSummary(tenantId: string, query: QueryCampaignsDto) {
    const where = this.buildWhereClause(tenantId, query);
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    let endDate = query.endDate ? new Date(query.endDate) : undefined;
    // Set endDate to end-of-day (23:59:59) to include all records for that day
    if (endDate) {
      endDate.setUTCHours(23, 59, 59, 999);
    }

    // 1. Find all matching campaign IDs first
    const campaigns = await this.prisma.campaign.findMany({
      where,
      select: { id: true },
    });

    const campaignIds = campaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return {
        _sum: {
          spent: 0,
          spend: 0,
          impressions: 0,
          clicks: 0,
          revenue: 0,
          conversions: 0,
          budget: 0,
        }
      };
    }

    // 2. Aggregate metrics for these campaigns
    const metricWhere: Prisma.MetricWhereInput = {
      campaignId: { in: campaignIds },
      ...(startDate || endDate ? {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      } : {}),
    };

    // 2. Identify campaigns that already have a 'lifetime_summary' row
    const lifetimeSummaryRows = await this.prisma.metric.findMany({
      where: { campaignId: { in: campaignIds }, source: 'lifetime_summary' },
      select: { campaignId: true }
    });
    const lifetimeSummaryIds = lifetimeSummaryRows.map(s => s.campaignId);

    // 3. Aggregate metrics for these campaigns
    const [periodAgg, summaryTotals, fallbackTotals, budgetAgg] = await Promise.all([
      // A. Period-filtered metrics (Standard behavior for date range)
      this.prisma.metric.aggregate({
        where: metricWhere,
        _sum: {
          spend: true, impressions: true, clicks: true, revenue: true, conversions: true,
        },
      }),
      // B. Absolute Totals (from special lifetime rows)
      this.prisma.metric.aggregate({
        where: { campaignId: { in: lifetimeSummaryIds }, source: 'lifetime_summary' },
        _sum: {
          spend: true, impressions: true, clicks: true, revenue: true, conversions: true,
        },
      }),
      // C. Fallback Totals (for campaigns that don't have a lifetime row yet)
      this.prisma.metric.aggregate({
        where: {
          campaignId: {
            in: campaignIds.filter(id => !lifetimeSummaryIds.includes(id))
          },
          source: { not: 'lifetime_summary' },
        },
        _sum: {
          spend: true, impressions: true, clicks: true, revenue: true, conversions: true,
        },
      }),
      // D. Budgets (Campaign level)
      this.prisma.campaign.aggregate({
        where,
        _sum: { budget: true },
      }),
    ]);

    const combine = (agg1: any, agg2: any, field: string) => {
      const val1 = agg1?._sum?.[field] || 0;
      const val2 = agg2?._sum?.[field] || 0;
      return Number(val1) + Number(val2);
    };

    return {
      _sum: {
        spent: combine(summaryTotals, fallbackTotals, 'spend'),
        spend: combine(summaryTotals, fallbackTotals, 'spend'),
        revenue: combine(summaryTotals, fallbackTotals, 'revenue'),
        impressions: combine(summaryTotals, fallbackTotals, 'impressions'),
        clicks: combine(summaryTotals, fallbackTotals, 'clicks'),
        conversions: combine(summaryTotals, fallbackTotals, 'conversions'),
        budget: Number(budgetAgg._sum.budget || 0),
        periodSpent: Number(periodAgg._sum.spend || 0),
      },
    };
  }
}
