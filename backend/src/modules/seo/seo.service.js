"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SeoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_range_util_1 = require("../../common/utils/date-range.util");
const google_search_console_service_1 = require("./google-search-console.service");
function toNumber(value, defaultValue = 0) {
    if (value === null || value === undefined)
        return defaultValue;
    if (typeof value === 'string') {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
    }
    if (typeof value === 'object' && 'toNumber' in value)
        return value.toNumber();
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
}
function toIsoDateOnly(date) {
    return date.toISOString().split('T')[0];
}
function utcDateOnlyFromIso(dateStr) {
    return new Date(`${dateStr}T00:00:00.000Z`);
}
function calculateCtr(clicks, impressions) {
    if (impressions <= 0)
        return 0;
    return clicks / impressions;
}
let SeoService = SeoService_1 = class SeoService {
    constructor(prisma, gscService) {
        this.prisma = prisma;
        this.gscService = gscService;
        this.logger = new common_1.Logger(SeoService_1.name);
    }
    async getSeoSummary(tenantId) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const previousStartDate = new Date(startDate);
            previousStartDate.setDate(previousStartDate.getDate() - 30);
            const previousEndDate = new Date(startDate);
            const webAnalyticsData = await this.prisma.webAnalyticsDaily.findMany({
                where: {
                    tenantId,
                    date: { gte: startDate, lte: endDate }
                },
                orderBy: { date: 'asc' }
            });
            const previousWebAnalyticsData = await this.prisma.webAnalyticsDaily.findMany({
                where: {
                    tenantId,
                    date: { gte: previousStartDate, lte: previousEndDate }
                },
                select: { sessions: true, newUsers: true, avgSessionDuration: true }
            });
            const latestOffpage = await this.prisma.seoOffpageMetricSnapshots.findFirst({
                where: { tenantId },
                orderBy: { date: 'desc' }
            });
            const keywordsData = await this.prisma.seoTopKeywords.findMany({
                where: {
                    tenantId,
                    date: { gte: startDate, lte: endDate }
                },
                select: { position: true, date: true }
            });
            const previousKeywordsData = await this.prisma.seoTopKeywords.findMany({
                where: {
                    tenantId,
                    date: { gte: previousStartDate, lte: previousEndDate }
                },
                select: { position: true }
            });
            const metricsData = await this.prisma.metric.groupBy({
                by: ['tenantId'],
                where: {
                    tenantId,
                    date: { gte: startDate, lte: endDate }
                },
                _sum: { clicks: true, impressions: true, spend: true }
            });
            const previousMetricsData = await this.prisma.metric.groupBy({
                by: ['tenantId'],
                where: {
                    tenantId,
                    date: { gte: previousStartDate, lte: previousEndDate }
                },
                _sum: { clicks: true, impressions: true, spend: true }
            });
            const totalOrganicSessions = webAnalyticsData.reduce((sum, day) => sum + day.sessions, 0);
            const prevOrganicSessions = previousWebAnalyticsData.reduce((sum, day) => sum + day.sessions, 0);
            const organicSessionsTrend = prevOrganicSessions > 0 ? ((totalOrganicSessions - prevOrganicSessions) / prevOrganicSessions) * 100 : 0;
            const totalNewUsers = webAnalyticsData.reduce((sum, day) => sum + day.newUsers, 0);
            const prevNewUsers = previousWebAnalyticsData.reduce((sum, day) => sum + (day.newUsers || 0), 0);
            const newUsersTrend = prevNewUsers > 0 ? ((totalNewUsers - prevNewUsers) / prevNewUsers) * 100 : 0;
            const avgSessionDuration = webAnalyticsData.length > 0 ?
                webAnalyticsData.reduce((sum, day) => sum + toNumber(day.avgSessionDuration), 0) / webAnalyticsData.length : 65;
            const prevAvgSessionDuration = previousWebAnalyticsData.length > 0 ?
                previousWebAnalyticsData.reduce((sum, day) => sum + toNumber(day.avgSessionDuration), 0) / previousWebAnalyticsData.length : 65;
            const avgSessionDurationTrend = prevAvgSessionDuration > 0 ? ((avgSessionDuration - prevAvgSessionDuration) / prevAvgSessionDuration) * 100 : 0;
            const goalCompletions = Math.round(totalOrganicSessions * 0.045);
            const prevGoalCompletions = Math.round(prevOrganicSessions * 0.045);
            const goalCompletionsTrend = prevGoalCompletions > 0 ? ((goalCompletions - prevGoalCompletions) / prevGoalCompletions) * 100 : 0;
            const avgPosition = keywordsData.length > 0 ?
                keywordsData.reduce((sum, kw) => sum + kw.position, 0) / keywordsData.length : 0;
            const prevAvgPosition = previousKeywordsData.length > 0 ?
                previousKeywordsData.reduce((sum, kw) => sum + kw.position, 0) / previousKeywordsData.length : 0;
            const avgPositionTrend = prevAvgPosition > 0 ? ((avgPosition - prevAvgPosition) / prevAvgPosition) * 100 : 0;
            const avgUR = latestOffpage?.ur ?? 0;
            const avgDR = latestOffpage?.dr ?? 0;
            const backlinks = latestOffpage?.backlinks ?? 0;
            const referringDomains = latestOffpage?.referringDomains ?? 0;
            const keywords = latestOffpage?.keywords ?? 0;
            const trafficCost = latestOffpage?.trafficCost ?? 0;
            const organicPages = latestOffpage?.organicTraffic ?? 0;
            const crawledPages = latestOffpage?.organicTraffic ?? 0;
            const currentPaid = metricsData[0]?._sum || { clicks: 0, impressions: 0, spend: 0 };
            const prevPaid = previousMetricsData[0]?._sum || { clicks: 0, impressions: 0, spend: 0 };
            const totalPaidTraffic = currentPaid.clicks ?? 0;
            const prevPaidTraffic = prevPaid.clicks ?? 0;
            const paidTrafficTrend = prevPaidTraffic > 0 ? ((totalPaidTraffic - prevPaidTraffic) / prevPaidTraffic) * 100 : 0;
            const totalImpressions = currentPaid.impressions ?? 0;
            const prevImpressions = prevPaid.impressions ?? 0;
            const impressionsTrend = prevImpressions > 0 ? ((totalImpressions - prevImpressions) / prevImpressions) * 100 : 0;
            const latestWebAnalytics = webAnalyticsData[webAnalyticsData.length - 1];
            const latestSeoData = await this.prisma.$queryRaw `
                SELECT metadata FROM web_analytics_daily
                WHERE tenant_id = ${tenantId}::uuid
                AND metadata IS NOT NULL
                ORDER BY date DESC
                LIMIT 1
            `;
            const seoMetrics = latestSeoData[0]?.metadata?.seoMetrics || {};
            const pickFallback = (primary, fallback) => {
                const fallbackValue = toNumber(fallback);
                return primary === 0 && fallbackValue !== 0 ? fallbackValue : primary;
            };
            return {
                organicSessions: totalOrganicSessions,
                newUsers: totalNewUsers,
                avgTimeOnPage: Math.round(avgSessionDuration) || 0,
                organicSessionsTrend: parseFloat(organicSessionsTrend.toFixed(1)),
                newUsersTrend: parseFloat(newUsersTrend.toFixed(1)),
                avgTimeOnPageTrend: parseFloat(avgSessionDurationTrend.toFixed(1)),
                goalCompletions: pickFallback(goalCompletions, seoMetrics.goalCompletions),
                goalCompletionsTrend: pickFallback(parseFloat(goalCompletionsTrend.toFixed(1)), seoMetrics.goalCompletionsTrend),
                avgPosition: pickFallback(parseFloat(avgPosition.toFixed(1)), seoMetrics.avgPosition),
                avgPositionTrend: pickFallback(parseFloat(avgPositionTrend.toFixed(1)), seoMetrics.avgPositionTrend),
                bounceRate: pickFallback(Number(latestWebAnalytics?.bounceRate || 0), seoMetrics.bounceRate),
                ur: pickFallback(avgUR, seoMetrics.ur),
                dr: pickFallback(avgDR, seoMetrics.dr),
                backlinks: pickFallback(backlinks, seoMetrics.backlinks),
                referringDomains: pickFallback(referringDomains, seoMetrics.referringDomains),
                keywords: pickFallback(keywords, seoMetrics.keywords),
                trafficCost: pickFallback(trafficCost, seoMetrics.trafficCost),
                paidTraffic: totalPaidTraffic,
                paidTrafficTrend: parseFloat(paidTrafficTrend.toFixed(1)),
                impressions: totalImpressions,
                impressionsTrend: parseFloat(impressionsTrend.toFixed(1)),
                organicPages: pickFallback(organicPages, seoMetrics.organicPages),
                crawledPages: pickFallback(crawledPages, seoMetrics.crawledPages)
            };
        }
        catch (error) {
            console.error('Error fetching SEO summary:', error);
            return {
                organicSessions: 0,
                newUsers: 0,
                avgTimeOnPage: 0,
                organicSessionsTrend: 0,
                newUsersTrend: 0,
                goalCompletions: 0,
                goalCompletionsTrend: 0,
                avgPosition: 0,
                avgPositionTrend: 0,
                bounceRate: 0,
                ur: 0,
                dr: 0,
                backlinks: 0,
                referringDomains: 0,
                keywords: 0,
                trafficCost: 0,
                paidTraffic: 0,
                paidTrafficTrend: 0,
                impressions: 0,
                impressionsTrend: 0,
                organicPages: 0,
                crawledPages: 0
            };
        }
    }
    async getSeoHistory(tenantId, days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
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
        const offpageData = await this.prisma.seoOffpageMetricSnapshots.findMany({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' }
        });
        const keywordsDataForHistory = await this.prisma.seoTopKeywords.findMany({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' }
        });
        const offpageMap = new Map();
        offpageData.forEach(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            offpageMap.set(dateStr, {
                backlinks: item.backlinks,
                referringDomains: item.referringDomains,
                keywords: item.keywords,
                trafficCost: item.trafficCost,
                avgPosition: 0,
                dr: item.dr,
                ur: item.ur,
                organicPages: item.organicTraffic,
                crawledPages: item.organicTraffic,
                organicTrafficValue: item.organicTrafficValue
            });
        });
        const avgPositionMap = new Map();
        const keywordsByDate = new Map();
        keywordsDataForHistory.forEach(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            if (!keywordsByDate.has(dateStr)) {
                keywordsByDate.set(dateStr, []);
            }
            keywordsByDate.get(dateStr).push(item);
        });
        keywordsByDate.forEach((keywords, dateStr) => {
            if (keywords.length > 0) {
                const avgPos = keywords.reduce((sum, kw) => sum + kw.position, 0) / keywords.length;
                avgPositionMap.set(dateStr, avgPos);
            }
        });
        const adsMap = new Map();
        adsData.forEach(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            adsMap.set(dateStr, {
                clicks: item._sum.clicks ?? 0,
                spend: toNumber(item._sum.spend),
                impressions: item._sum.impressions ?? 0
            });
        });
        const historyData = organicData.map(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            const ads = adsMap.get(dateStr) || { clicks: 0, spend: 0, impressions: 0 };
            const offpageMetricsForDate = offpageMap.get(dateStr);
            const avgPositionForDate = avgPositionMap.get(dateStr) || 0;
            return {
                date: dateStr,
                organicTraffic: item.sessions,
                paidTraffic: ads.clicks,
                paidTrafficCost: ads.spend,
                impressions: ads.impressions,
                backlinks: offpageMetricsForDate?.backlinks || 0,
                referringDomains: offpageMetricsForDate?.referringDomains || 0,
                keywords: offpageMetricsForDate?.keywords || 0,
                trafficCost: offpageMetricsForDate?.trafficCost || 0,
                avgPosition: avgPositionForDate,
                dr: offpageMetricsForDate?.dr || 0,
                ur: offpageMetricsForDate?.ur || 0,
                organicPages: offpageMetricsForDate?.organicPages || 0,
                crawledPages: offpageMetricsForDate?.crawledPages || 0,
                organicTrafficValue: offpageMetricsForDate?.organicTrafficValue || 0
            };
        });
        return historyData;
    }
    async getSeoKeywordIntent(tenantId) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        const previousEndDate = new Date(startDate);
        try {
            const currentData = await this.prisma.$queryRaw `
                SELECT type, SUM(keywords) as keywords, SUM(traffic) as traffic
                FROM seo_search_intent
                WHERE tenant_id = ${tenantId}::uuid
                AND date >= ${startDate}
                AND date <= ${endDate}
                GROUP BY type
            `;
            const previousData = await this.prisma.$queryRaw `
                SELECT type, SUM(keywords) as keywords, SUM(traffic) as traffic
                FROM seo_search_intent
                WHERE tenant_id = ${tenantId}::uuid
                AND date >= ${previousStartDate}
                AND date < ${previousEndDate}
                GROUP BY type
            `;
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
                return currentData.map((item) => {
                    const prev = prevMap.get(item.type) || { keywords: 0, traffic: 0 };
                    const currentKeywords = toNumber(item.keywords);
                    const currentTraffic = toNumber(item.traffic);
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
            return [];
        }
        catch (error) {
            console.error('Error fetching SEO keyword intent:', error);
            return [];
        }
    }
    async getSeoTrafficByLocation(tenantId) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        try {
            const locationData = await this.prisma.seoTrafficByLocation.findMany({
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { traffic: 'desc' },
            });
            const aggregatedMap = new Map();
            locationData.forEach(item => {
                const parts = item.location.split(',');
                let city = parts[0].trim();
                let country = parts.length > 1 ? parts[1].trim() : city;
                if (parts.length === 1) {
                    city = item.location;
                    country = item.location;
                }
                const key = item.location;
                if (aggregatedMap.has(key)) {
                    const existing = aggregatedMap.get(key);
                    existing.traffic += item.traffic;
                    existing.keywords = Math.max(existing.keywords, item.keywords);
                }
                else {
                    aggregatedMap.set(key, {
                        country: country,
                        city: city,
                        traffic: item.traffic,
                        keywords: item.keywords,
                        countryCode: this.getCountryCode(country)
                    });
                }
            });
            return Array.from(aggregatedMap.values())
                .sort((a, b) => b.traffic - a.traffic)
                .slice(0, 10);
        }
        catch (error) {
            console.error('Error fetching SEO traffic by location:', error);
            return [];
        }
    }
    getCountryCode(countryName) {
        const countryMap = {
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
    async getOverview(tenantId, period) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const days = date_range_util_1.DateRangeUtil.parsePeriodDays(period || '30d');
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
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
            }
            else {
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
        else {
            if (siteUrl) {
                gscDataCount = await this.prisma.searchConsolePerformance.count({
                    where: { tenantId, siteUrl, date: { gte: startDate, lte: endDate } },
                });
            }
            else {
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
                where: { tenantId, siteUrl: siteUrl, date: { gte: startDate, lte: endDate } },
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
    async getDashboard(tenantId, period, limit = 10) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const days = date_range_util_1.DateRangeUtil.parsePeriodDays(period || '30d');
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
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
        let gscDaily = [];
        let topQueries = [];
        let topPages = [];
        let topCountries = [];
        let topDevices = [];
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
                    date: toIsoDateOnly(r.date),
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
    async syncGscForTenant(tenantId, options) {
        const days = options?.days ?? 30;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true },
        });
        const siteUrl = this.gscService.getSiteUrl(tenant?.settings);
        if (!siteUrl || !this.gscService.hasCredentials()) {
            return { success: false, message: 'GSC not configured' };
        }
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const startDateStr = toIsoDateOnly(startDate);
        const endDateStr = toIsoDateOnly(endDate);
        const rowLimit = 25000;
        let startRow = 0;
        const allRows = [];
        while (true) {
            const report = await this.gscService.querySearchAnalytics({
                siteUrl,
                startDate: startDateStr,
                endDate: endDateStr,
                rowLimit,
                startRow,
            });
            const rows = (report.rows || []);
            if (!rows.length)
                break;
            allRows.push(...rows);
            if (rows.length < rowLimit)
                break;
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
            if (!dateStr)
                return null;
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
                ctr: Number(row.ctr || 0),
                position: Number(row.position || 0),
                externalKey,
            };
        })
            .filter(Boolean);
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
    async getTopKeywords(tenantId) {
        try {
            const keywords = await this.prisma.seoTopKeywords.findMany({
                where: {
                    tenantId
                },
                orderBy: {
                    traffic: 'desc'
                },
                take: 10,
                select: {
                    keyword: true,
                    position: true,
                    volume: true,
                    traffic: true
                }
            });
            const totalTraffic = keywords.reduce((sum, kw) => sum + kw.traffic, 0);
            return keywords.map(kw => ({
                keyword: kw.keyword,
                position: kw.position,
                volume: kw.volume,
                trafficPercent: totalTraffic > 0 ? Math.round((kw.traffic / totalTraffic) * 100 * 10) / 10 : 0
            }));
        }
        catch (error) {
            console.error('Error fetching top keywords:', error);
            return [];
        }
    }
    async getOffpageSnapshots(tenantId) {
        try {
            const snapshots = await this.prisma.seoOffpageMetricSnapshots.findMany({
                where: {
                    tenantId
                },
                orderBy: {
                    date: 'asc'
                },
                select: {
                    date: true,
                    backlinks: true,
                    referringDomains: true,
                    ur: true,
                    dr: true,
                    organicTrafficValue: true
                }
            });
            return snapshots.map(snapshot => ({
                date: snapshot.date.toISOString().split('T')[0],
                backlinks: snapshot.backlinks,
                referringDomains: snapshot.referringDomains,
                ur: snapshot.ur,
                dr: snapshot.dr,
                organicTrafficValue: snapshot.organicTrafficValue
            }));
        }
        catch (error) {
            console.error('Error fetching offpage snapshots:', error);
            return [];
        }
    }
    async getAnchorTexts(tenantId) {
        try {
            const anchorTexts = await this.prisma.seoAnchorText.findMany({
                where: {
                    tenantId
                },
                orderBy: {
                    referringDomains: 'desc'
                },
                select: {
                    anchorText: true,
                    referringDomains: true,
                    totalBacklinks: true,
                    dofollowBacklinks: true,
                    traffic: true,
                    trafficPercentage: true
                }
            });
            return anchorTexts.map(anchor => ({
                text: anchor.anchorText,
                referringDomains: anchor.referringDomains,
                totalBacklinks: anchor.totalBacklinks,
                dofollowBacklinks: anchor.dofollowBacklinks,
                traffic: anchor.traffic,
                trafficPercentage: anchor.trafficPercentage
            }));
        }
        catch (error) {
            console.error('Error fetching anchor texts:', error);
            return [];
        }
    }
    async getAiInsights(tenantId) {
        try {
            const insights = await this.prisma.aiInsight.findMany({
                where: {
                    tenantId
                },
                orderBy: {
                    occurredAt: 'desc'
                },
                select: {
                    id: true,
                    type: true,
                    source: true,
                    title: true,
                    message: true,
                    payload: true,
                    status: true,
                    occurredAt: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return insights.map(insight => ({
                id: insight.id,
                type: insight.type,
                source: insight.source,
                title: insight.title,
                message: insight.message,
                payload: insight.payload,
                status: insight.status,
                occurredAt: insight.occurredAt.toISOString(),
                createdAt: insight.createdAt.toISOString(),
                updatedAt: insight.updatedAt.toISOString()
            }));
        }
        catch (error) {
            console.error('Error fetching AI insights:', error);
            return [];
        }
    }
};
exports.SeoService = SeoService;
exports.SeoService = SeoService = SeoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        google_search_console_service_1.GoogleSearchConsoleService])
], SeoService);
//# sourceMappingURL=seo.service.js.map