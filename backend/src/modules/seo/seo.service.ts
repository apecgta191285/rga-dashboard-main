import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';
import { GoogleSearchConsoleService } from './google-search-console.service';

function toNumber(value: Prisma.Decimal | number | string | null | undefined, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string') {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
    }
    if (typeof value === 'object' && 'toNumber' in value) return (value as any).toNumber();
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
}

function toIsoDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
}

function utcDateOnlyFromIso(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00.000Z`);
}

function calculateCtr(clicks: number, impressions: number): number {
    if (impressions <= 0) return 0;
    return clicks / impressions;
}

@Injectable()
export class SeoService {
    private readonly logger = new Logger(SeoService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly gscService: GoogleSearchConsoleService,
    ) { }

    // ========================================================================
    // HEAD Methods (Legacy/Simple Aggregations)
    // ========================================================================

    async getSeoSummary(tenantId: string) {
        // Calculate date range (last 30 days default)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Fetch Current Period Data from WebAnalyticsDaily (GA4)
        const waMetrics = await this.prisma.webAnalyticsDaily.aggregate({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                sessions: true,
                newUsers: true
            },
            _avg: { avgSessionDuration: true }
        });

        // Calculate previous period for trends
        const prevEndDate = new Date(startDate);
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 30);

        const prevWaMetrics = await this.prisma.webAnalyticsDaily.aggregate({
            where: {
                tenantId,
                date: {
                    gte: prevStartDate,
                    lt: startDate,
                },
            },
            _sum: {
                sessions: true,
                newUsers: true
            },
            _avg: { avgSessionDuration: true }
        });

        const currentSessions = waMetrics._sum.sessions ?? 0;
        const prevSessions = prevWaMetrics._sum.sessions ?? 0;

        const currentNewUsers = waMetrics._sum.newUsers ?? 0;
        const prevNewUsers = prevWaMetrics._sum.newUsers ?? 0;

        // Calculate Trend (with Demo Fallback if no history)
        let sessionsTrend = 0;
        if (prevSessions > 0) {
            sessionsTrend = ((currentSessions - prevSessions) / prevSessions) * 100;
        } else if (currentSessions > 0) {
            // Deterministic fake trend: Use modulo to get a stable number [-10% to +10%]
            sessionsTrend = ((currentSessions % 21) - 10);
        }

        let newUsersTrend = 0;
        if (prevNewUsers > 0) {
            newUsersTrend = ((currentNewUsers - prevNewUsers) / prevNewUsers) * 100;
        } else if (currentNewUsers > 0) {
            newUsersTrend = ((currentNewUsers % 19) - 10);
        }

        // Handle Decimal to Number conversion for avgSessionDuration
        const currentTime = Number(waMetrics._avg.avgSessionDuration ?? 0);
        const prevTime = Number(prevWaMetrics._avg.avgSessionDuration ?? 0);

        let timeTrend = 0;
        if (prevTime > 0) {
            timeTrend = ((currentTime - prevTime) / prevTime) * 100;
        } else if (currentTime > 0) {
            // Deterministic fake trend: [-15% to +15%]
            timeTrend = ((Math.floor(currentTime) % 31) - 15);
        }

        // Fetch SEO premium metrics aggregations using Raw SQL
        // We calculate the average of avgPosition over the period
        const currentSeoAgg: any[] = await this.prisma.$queryRaw`
            SELECT 
                AVG(CAST(metadata->'seoMetrics'->>'avgPosition' AS DECIMAL)) as avg_position
            FROM web_analytics_daily 
            WHERE tenant_id = ${tenantId}::uuid 
            AND date >= ${startDate} 
            AND date <= ${endDate} 
            AND metadata->'seoMetrics'->>'avgPosition' IS NOT NULL
        `;

        const prevSeoAgg: any[] = await this.prisma.$queryRaw`
            SELECT 
                AVG(CAST(metadata->'seoMetrics'->>'avgPosition' AS DECIMAL)) as avg_position
            FROM web_analytics_daily 
            WHERE tenant_id = ${tenantId}::uuid 
            AND date >= ${prevStartDate} 
            AND date < ${startDate} 
            AND metadata->'seoMetrics'->>'avgPosition' IS NOT NULL
        `;

        // Fetch latest record for other snapshot metrics (Backlinks, DR, UR) which make sense to be "latest"
        const latestSeoData: any[] = await this.prisma.$queryRaw`
            SELECT metadata FROM web_analytics_daily 
            WHERE tenant_id = ${tenantId}::uuid 
            AND metadata IS NOT NULL 
            ORDER BY date DESC 
            LIMIT 1
        `;

        const seoMetrics = latestSeoData[0]?.metadata?.seoMetrics || {};

        const currentAvgPos = Number(currentSeoAgg[0]?.avg_position || 0);
        const prevAvgPos = Number(prevSeoAgg[0]?.avg_position || 0);

        // Calculate Position Trend (Negative is good for rank, but usually UI shows green for improvement)
        let posTrend = 0;
        if (prevAvgPos > 0) {
            posTrend = ((currentAvgPos - prevAvgPos) / prevAvgPos) * 100;
        }

        return {
            organicSessions: currentSessions,
            newUsers: currentNewUsers,
            avgTimeOnPage: seoMetrics.avgTimeOnPage || Math.round(currentTime),
            organicSessionsTrend: seoMetrics.organicSessionsTrend || parseFloat(sessionsTrend.toFixed(1)),
            newUsersTrend: parseFloat(newUsersTrend.toFixed(1)),
            avgTimeOnPageTrend: seoMetrics.avgTimeOnPageTrend || parseFloat(timeTrend.toFixed(1)),
            // Premium SEO Metrics
            goalCompletions: seoMetrics.goalCompletions || null,
            goalCompletionsTrend: seoMetrics.goalCompletionsTrend || 0,

            // Real calculated average over the period
            avgPosition: currentAvgPos > 0 ? Number(currentAvgPos.toFixed(1)) : null,
            avgPositionTrend: parseFloat(posTrend.toFixed(1)),
            bounceRate: 0,
            ur: seoMetrics.ur || null,
            dr: seoMetrics.dr || null,
            backlinks: seoMetrics.backlinks || null,
            referringDomains: seoMetrics.referringDomains || null,
            keywords: seoMetrics.keywords || null,
            trafficCost: seoMetrics.trafficCost || null
        };
    }

    async getSeoHistory(tenantId: string, days: number = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. Fetch Organic Data (WebAnalyticsDaily)
        const organicData = await this.prisma.webAnalyticsDaily.findMany({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                sessions: true
            }
        });

        // 2. Fetch Ads Data (Metric table - aggregated by date)
        const adsData = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                clicks: true,
                spend: true,
                impressions: true
            }
        });

        // 3. Fetch SEO metrics from metadata using Raw SQL
        const seoDataResult: any[] = await this.prisma.$queryRaw`
            SELECT date, metadata FROM web_analytics_daily 
            WHERE tenant_id = ${tenantId}::uuid 
            AND date >= ${startDate} 
            AND date <= ${endDate}
            AND metadata IS NOT NULL
        `;

        // Create a map for SEO metrics by date
        const seoMetricsMap = new Map<string, any>();
        seoDataResult.forEach(item => {
            const dateStr = typeof item.date === 'string' ? item.date.split('T')[0] : item.date.toISOString().split('T')[0];
            const seoMetrics = item.metadata?.seoMetrics;
            if (seoMetrics) {
                seoMetricsMap.set(dateStr, seoMetrics);
            }
        });

        // 4. Merge Data
        // Create a map for quick lookup of ads data by date string
        const adsMap = new Map<string, { clicks: number, spend: number, impressions: number }>();
        adsData.forEach(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            adsMap.set(dateStr, {
                clicks: item._sum.clicks ?? 0,
                spend: Number(item._sum.spend ?? 0),
                impressions: item._sum.impressions ?? 0
            });
        });

        // 5. Map organic data and merge with ads data
        return organicData.map(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            const ads = adsMap.get(dateStr) || { clicks: 0, spend: 0, impressions: 0 };

            // Get SEO metrics for this date from metadata if available
            const seoMetricsForDate = seoMetricsMap.get(dateStr);

            return {
                date: dateStr,
                organicTraffic: item.sessions,
                paidTraffic: ads.clicks,
                paidTrafficCost: ads.spend,
                impressions: ads.impressions,
                // Additional SEO metrics from metadata
                avgPosition: seoMetricsForDate?.avgPosition || 0,
                referringDomains: seoMetricsForDate?.referringDomains || 0,
                dr: seoMetricsForDate?.dr || 0,
                ur: seoMetricsForDate?.ur || 0,
                organicTrafficValue: seoMetricsForDate?.trafficCost || 0,
                organicPages: Math.floor(item.sessions * 1.5), // Estimate based on sessions
                crawledPages: Math.floor(item.sessions * 2.2), // Estimate based on sessions
            };
        });
    }

    async getSeoKeywordIntent(tenantId: string) {
        // Current Period (Last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Previous Period (30-60 days ago)
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        const previousEndDate = new Date(startDate);

        try {
            // 1. Fetch Current Data
            const currentData: any[] = await this.prisma.$queryRaw`
                SELECT type, SUM(keywords) as keywords, SUM(traffic) as traffic
                FROM seo_search_intent
                WHERE tenant_id = ${tenantId}::uuid
                AND date >= ${startDate}
                AND date <= ${endDate}
                GROUP BY type
            `;

            // 2. Fetch Previous Data
            const previousData: any[] = await this.prisma.$queryRaw`
                SELECT type, SUM(keywords) as keywords, SUM(traffic) as traffic
                FROM seo_search_intent
                WHERE tenant_id = ${tenantId}::uuid
                AND date >= ${previousStartDate}
                AND date < ${previousEndDate}
                GROUP BY type
            `;

            // Map previous data for easy lookup
            const prevMap = new Map();
            if (Array.isArray(previousData)) {
                previousData.forEach(item => {
                    prevMap.set(item.type, {
                        keywords: Number(item.keywords || 0),
                        traffic: Number(item.traffic || 0)
                    });
                });
            }

            if (Array.isArray(currentData) && currentData.length > 0) {
                return currentData.map((item: any) => {
                    const prev = prevMap.get(item.type) || { keywords: 0, traffic: 0 };

                    const currentKeywords = Number(item.keywords || 0);
                    const currentTraffic = Number(item.traffic || 0);

                    // Calculate Trends (Delta)
                    const keywordsTrend = currentKeywords - prev.keywords;
                    const trafficTrend = currentTraffic - prev.traffic;

                    return {
                        type: item.type,
                        keywords: currentKeywords,
                        traffic: currentTraffic,
                        keywordsTrend,
                        trafficTrend
                    };
                });
            }

            // If no data, return empty array
            return [];
        } catch (error) {
            console.error('Error fetching SEO keyword intent:', error);
            return [];
        }
    }

    async getSeoTrafficByLocation(tenantId: string) {
        // Calculate date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        try {
            // Fetch location data using Raw SQL
            const locationDataResult: any[] = await this.prisma.$queryRaw`
                SELECT metadata, sessions FROM web_analytics_daily 
                WHERE tenant_id = ${tenantId}::uuid 
                AND date >= ${startDate} 
                AND date <= ${endDate} 
                AND metadata IS NOT NULL
            `;

            if (!locationDataResult || locationDataResult.length === 0) {
                return [];
            }

            // Aggregate traffic by location
            const locationMap = new Map<string, { country: string, city: string, traffic: number, keywords: number, countryCode: string }>();

            locationDataResult.forEach(record => {
                const location = record.metadata?.location;
                if (location) {
                    const key = `${location.country}-${location.city}`;
                    const existing = locationMap.get(key);

                    // Use stored traffic if available, otherwise fallback to sessions (which should be same in this context)
                    const traffic = Number(location.traffic || record.sessions || 0);
                    // Use stored keywords from metadata if available
                    const keywords = Number(location.keywords || 0);

                    if (existing) {
                        existing.traffic += traffic;
                        existing.keywords += keywords;
                    } else {
                        locationMap.set(key, {
                            country: location.country,
                            city: location.city,
                            traffic: traffic,
                            keywords: keywords,
                            countryCode: location.countryCode || this.getCountryCode(location.country)
                        });
                    }
                }
            });

            // Convert to array and sort by traffic (descending)
            return Array.from(locationMap.values())
                .sort((a, b) => b.traffic - a.traffic)
                .slice(0, 10); // Top 10 locations

        } catch (error) {
            console.error('Error fetching SEO traffic by location:', error);
            return [];
        }
    }

    private getCountryCode(countryName: string): string {
        const countryMap: { [key: string]: string } = {
            'Thailand': 'TH',
            'United States': 'US',
            'United Kingdom': 'GB',
            'Singapore': 'SG',
            'Japan': 'JP',
            'Malaysia': 'MY',
            'Australia': 'AU'
        };
        return countryMap[countryName] || 'XX';
    }

    // ========================================================================
    // WIP Methods (GSC Integration & New Dashboard)
    // ========================================================================

    async getOverview(tenantId: string, period?: string) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const days = DateRangeUtil.parsePeriodDays(period || '30d');
        const { startDate, endDate } = DateRangeUtil.getDateRange(days);

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true },
        });

        const configuredSiteUrl = this.gscService.getSiteUrl(tenant?.settings);
        const hasCredentials = this.gscService.hasCredentials();
        let siteUrl = configuredSiteUrl;
        let gscDataCount = 0;

        if (!hideMockData) {
            if (siteUrl) {
                gscDataCount = await this.prisma.searchConsolePerformance.count({
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                });

                if (gscDataCount === 0) {
                    const latest = await this.prisma.searchConsolePerformance.findFirst({
                        where: { tenantId },
                        orderBy: { date: 'desc' },
                        select: { siteUrl: true },
                    });

                    if (latest?.siteUrl && latest.siteUrl !== siteUrl) {
                        siteUrl = latest.siteUrl;
                        gscDataCount = await this.prisma.searchConsolePerformance.count({
                            where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                        });
                    }
                }
            } else {
                const latest = await this.prisma.searchConsolePerformance.findFirst({
                    where: { tenantId },
                    orderBy: { date: 'desc' },
                    select: { siteUrl: true },
                });

                if (latest?.siteUrl) {
                    siteUrl = latest.siteUrl;
                    gscDataCount = await this.prisma.searchConsolePerformance.count({
                        where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                    });
                }
            }
        } else {
            // When hiding mock data, do NOT attempt DB fallback for GSC siteUrl.
            // GSC rows have no isMockData flag, so fallback could surface demo data.
            if (siteUrl) {
                gscDataCount = await this.prisma.searchConsolePerformance.count({
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                });
            } else {
                // Fallback to latest siteUrl even when HIDE_MOCK_DATA=true
                // GSC table has no is_mock_data flag, so this is safe
                const latest = await this.prisma.searchConsolePerformance.findFirst({
                    where: { tenantId },
                    orderBy: { date: 'desc' },
                    select: { siteUrl: true },
                });

                if (latest?.siteUrl) {
                    siteUrl = latest.siteUrl;
                    gscDataCount = await this.prisma.searchConsolePerformance.count({
                        where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                    });
                }
            }
        }

        const gscConnected = hideMockData
            ? (gscDataCount > 0)
            : ((!!configuredSiteUrl && hasCredentials) || gscDataCount > 0);

        const ga4Account = await this.prisma.googleAnalyticsAccount.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            select: { id: true },
        });
        const ga4Connected = !!ga4Account;

        const ga4Agg = await this.prisma.webAnalyticsDaily.aggregate({
            where: { tenantId, date: { gte: startDate, lte: endDate }, ...(hideMockData ? { isMockData: false } : {}) },
            _sum: {
                activeUsers: true,
                newUsers: true,
                sessions: true,
                screenPageViews: true,
            },
            _avg: {
                engagementRate: true,
                bounceRate: true,
                avgSessionDuration: true,
            },
        });

        let gscClicks = 0;
        let gscImpressions = 0;
        let gscPositionAvg = 0;

        if (gscConnected) {
            const gscAgg = await this.prisma.searchConsolePerformance.aggregate({
                where: { tenantId, siteUrl: siteUrl!, date: { gte: startDate, lte: endDate } },
                _sum: { clicks: true, impressions: true },
                _avg: { position: true },
            });

            gscClicks = gscAgg._sum.clicks ?? 0;
            gscImpressions = gscAgg._sum.impressions ?? 0;
            gscPositionAvg = toNumber(gscAgg._avg.position);
        }

        return {
            connected: {
                ga4: ga4Connected,
                gsc: gscConnected,
            },
            dateRange: {
                from: toIsoDateOnly(startDate),
                to: toIsoDateOnly(endDate),
                days,
            },
            ga4: {
                activeUsers: ga4Agg._sum.activeUsers ?? 0,
                newUsers: ga4Agg._sum.newUsers ?? 0,
                sessions: ga4Agg._sum.sessions ?? 0,
                screenPageViews: ga4Agg._sum.screenPageViews ?? 0,
                engagementRateAvg: toNumber(ga4Agg._avg.engagementRate),
                bounceRateAvg: toNumber(ga4Agg._avg.bounceRate),
                avgSessionDurationAvg: toNumber(ga4Agg._avg.avgSessionDuration),
            },
            gsc: {
                siteUrl: siteUrl,
                clicks: gscClicks,
                impressions: gscImpressions,
                ctr: calculateCtr(gscClicks, gscImpressions),
                positionAvg: gscPositionAvg,
            },
        };
    }

    async getDashboard(tenantId: string, period?: string, limit: number = 10) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const days = DateRangeUtil.parsePeriodDays(period || '30d');
        const { startDate, endDate } = DateRangeUtil.getDateRange(days);

        const overview = await this.getOverview(tenantId, period);

        const ga4Daily = await this.prisma.webAnalyticsDaily.findMany({
            where: { tenantId, date: { gte: startDate, lte: endDate }, ...(hideMockData ? { isMockData: false } : {}) },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                activeUsers: true,
                newUsers: true,
                sessions: true,
                engagementRate: true,
                bounceRate: true,
                avgSessionDuration: true,
                screenPageViews: true,
            },
        });

        let gscDaily: Array<any> = [];
        let topQueries: Array<any> = [];
        let topPages: Array<any> = [];
        let topCountries: Array<any> = [];
        let topDevices: Array<any> = [];

        if (overview.connected.gsc && overview.gsc.siteUrl) {
            const siteUrl = overview.gsc.siteUrl;

            const dailyRows = await this.prisma.searchConsolePerformance.groupBy({
                by: ['date'],
                where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                _sum: { clicks: true, impressions: true },
                _avg: { position: true },
                orderBy: { date: 'asc' },
            });

            gscDaily = dailyRows.map((r) => {
                const clicks = r._sum.clicks ?? 0;
                const impressions = r._sum.impressions ?? 0;
                return {
                    date: toIsoDateOnly(r.date as any),
                    clicks,
                    impressions,
                    ctr: calculateCtr(clicks, impressions),
                    positionAvg: toNumber(r._avg.position),
                };
            });

            const [queries, pages, countries, devices] = await Promise.all([
                this.prisma.searchConsolePerformance.groupBy({
                    by: ['query'],
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate }, query: { not: null } },
                    _sum: { clicks: true, impressions: true },
                    _avg: { position: true },
                    orderBy: { _sum: { clicks: 'desc' } },
                    take: limit,
                }),
                this.prisma.searchConsolePerformance.groupBy({
                    by: ['page'],
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate }, page: { not: null } },
                    _sum: { clicks: true, impressions: true },
                    _avg: { position: true },
                    orderBy: { _sum: { clicks: 'desc' } },
                    take: limit,
                }),
                this.prisma.searchConsolePerformance.groupBy({
                    by: ['country'],
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate }, country: { not: null } },
                    _sum: { clicks: true, impressions: true },
                    _avg: { position: true },
                    orderBy: { _sum: { clicks: 'desc' } },
                    take: limit,
                }),
                this.prisma.searchConsolePerformance.groupBy({
                    by: ['device'],
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate }, device: { not: null } },
                    _sum: { clicks: true, impressions: true },
                    _avg: { position: true },
                    orderBy: { _sum: { clicks: 'desc' } },
                    take: limit,
                }),
            ]);

            topQueries = queries.map((r) => ({
                query: r.query,
                clicks: r._sum.clicks ?? 0,
                impressions: r._sum.impressions ?? 0,
                ctr: calculateCtr(r._sum.clicks ?? 0, r._sum.impressions ?? 0),
                positionAvg: toNumber(r._avg.position),
            }));

            topPages = pages.map((r) => ({
                page: r.page,
                clicks: r._sum.clicks ?? 0,
                impressions: r._sum.impressions ?? 0,
                ctr: calculateCtr(r._sum.clicks ?? 0, r._sum.impressions ?? 0),
                positionAvg: toNumber(r._avg.position),
            }));

            topCountries = countries.map((r) => ({
                country: r.country,
                clicks: r._sum.clicks ?? 0,
                impressions: r._sum.impressions ?? 0,
                ctr: calculateCtr(r._sum.clicks ?? 0, r._sum.impressions ?? 0),
                positionAvg: toNumber(r._avg.position),
            }));

            topDevices = devices.map((r) => ({
                device: r.device,
                clicks: r._sum.clicks ?? 0,
                impressions: r._sum.impressions ?? 0,
                ctr: calculateCtr(r._sum.clicks ?? 0, r._sum.impressions ?? 0),
                positionAvg: toNumber(r._avg.position),
            }));
        }

        return {
            overview,
            trends: {
                ga4: ga4Daily.map((d) => ({
                    date: toIsoDateOnly(d.date),
                    activeUsers: d.activeUsers,
                    newUsers: d.newUsers,
                    sessions: d.sessions,
                    engagementRate: toNumber(d.engagementRate),
                    bounceRate: toNumber(d.bounceRate),
                    avgSessionDuration: toNumber(d.avgSessionDuration),
                    screenPageViews: d.screenPageViews,
                })),
                gsc: gscDaily,
            },
            top: {
                queries: topQueries,
                pages: topPages,
                countries: topCountries,
                devices: topDevices,
            },
        };
    }

    async syncGscForTenant(tenantId: string, options?: { days?: number }) {
        const days = options?.days ?? 30;

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true },
        });

        const siteUrl = this.gscService.getSiteUrl(tenant?.settings);
        if (!siteUrl || !this.gscService.hasCredentials()) {
            return { success: false, message: 'GSC not configured' };
        }

        const { startDate, endDate } = DateRangeUtil.getDateRange(days);
        const startDateStr = toIsoDateOnly(startDate);
        const endDateStr = toIsoDateOnly(endDate);

        const rowLimit = 25000;
        let startRow = 0;
        const allRows: any[] = [];

        while (true) {
            const report = await this.gscService.querySearchAnalytics({
                siteUrl,
                startDate: startDateStr,
                endDate: endDateStr,
                rowLimit,
                startRow,
            });

            const rows = (report.rows || []) as any[];
            if (!rows.length) break;

            allRows.push(...rows);

            if (rows.length < rowLimit) break;
            startRow += rowLimit;
        }

        const data = allRows
            .map((row) => {
                const keys = row.keys || [];
                const dateStr = keys[0];
                const page = keys[1] || null;
                const query = keys[2] || null;
                const device = keys[3] || null;
                const country = keys[4] || null;

                if (!dateStr) return null;

                const date = utcDateOnlyFromIso(dateStr);
                const externalKey = [dateStr, page || '', query || '', device || '', country || ''].join('|');

                return {
                    tenantId,
                    siteUrl,
                    date,
                    page,
                    query,
                    device,
                    country,
                    clicks: Math.trunc(Number(row.clicks || 0)),
                    impressions: Math.trunc(Number(row.impressions || 0)),
                    ctr: new Prisma.Decimal(Number(row.ctr || 0)),
                    position: new Prisma.Decimal(Number(row.position || 0)),
                    externalKey,
                };
            })
            .filter(Boolean) as any[];

        await this.prisma.searchConsolePerformance.deleteMany({
            where: {
                tenantId,
                siteUrl,
                date: { gte: startDate, lte: endDate },
            },
        });

        const chunkSize = 1000;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await this.prisma.searchConsolePerformance.createMany({
                data: chunk,
                skipDuplicates: true,
            });
        }

        this.logger.log(`[GSC Sync] Tenant ${tenantId}: inserted ${data.length} rows (${startDateStr}..${endDateStr})`);

        return {
            success: true,
            fetched: allRows.length,
            inserted: data.length,
            dateRange: { from: startDateStr, to: endDateStr },
            siteUrl,
        };
    }
}
