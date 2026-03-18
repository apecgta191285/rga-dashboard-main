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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_range_util_1 = require("../../common/utils/date-range.util");
const client_1 = require("@prisma/client");
const dashboard_overview_dto_1 = require("./dto/dashboard-overview.dto");
function toNumber(value, defaultValue = 0) {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    if (typeof value === 'string') {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
    }
    if (typeof value === 'object' && 'toNumber' in value) {
        return value.toNumber();
    }
    return Number(value);
}
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(tenantId, days = 30, MOCK) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const { startDate: currentStartDate, endDate: today } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const { startDate: previousStartDate } = date_range_util_1.DateRangeUtil.getPreviousPeriodDateRange(currentStartDate, days);
        const totalCampaigns = await this.prisma.campaign.count({
            where: { tenantId },
        });
        const activeCampaigns = await this.prisma.campaign.count({
            where: {
                tenantId,
                status: client_1.CampaignStatus.ACTIVE
            },
        });
        const previousTotalCampaigns = await this.prisma.campaign.count({
            where: {
                tenantId,
                createdAt: {
                    lte: currentStartDate,
                },
            },
        });
        const currentMetrics = await this.prisma.metric.aggregate({
            where: {
                campaign: { tenantId },
                date: {
                    gte: currentStartDate,
                    lte: today,
                },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
            },
        });
        const previousMetrics = await this.prisma.metric.aggregate({
            where: {
                campaign: { tenantId },
                date: {
                    gte: previousStartDate,
                    lt: currentStartDate,
                },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
            },
        });
        const calculateTrend = (current, previous) => {
            if (previous === 0)
                return 0;
            return ((current - previous) / previous) * 100;
        };
        const hasMockData = await this.prisma.metric.findFirst({
            where: {
                campaign: { tenantId },
                date: {
                    gte: currentStartDate,
                    lte: today,
                },
                isMockData: true,
            },
        });
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
                spend: calculateTrend(toNumber(currentMetrics._sum.spend), toNumber(previousMetrics._sum.spend)),
                impressions: calculateTrend(currentMetrics._sum.impressions ?? 0, previousMetrics._sum.impressions ?? 0),
                clicks: calculateTrend(currentMetrics._sum.clicks ?? 0, previousMetrics._sum.clicks ?? 0),
            },
        };
    }
    async getSummaryByPlatform(tenantId, days = 30, platform = 'ALL') {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const { startDate: currentStartDate, endDate: today } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const { startDate: previousStartDate } = date_range_util_1.DateRangeUtil.getPreviousPeriodDateRange(currentStartDate, days);
        if (platform !== 'ALL') {
            platform = platform.toUpperCase().replace('-', '_');
            if (platform === 'GOOGLE')
                platform = 'GOOGLE_ADS';
            if (platform === 'LINE')
                platform = 'LINE_ADS';
        }
        const platformEnum = platform;
        let totalCampaigns = 0;
        let activeCampaigns = 0;
        if (platform === 'ALL') {
            totalCampaigns = await this.prisma.campaign.count({ where: { tenantId } });
            activeCampaigns = await this.prisma.campaign.count({ where: { tenantId, status: client_1.CampaignStatus.ACTIVE } });
        }
        else if (platformEnum === 'INSTAGRAM') {
            const campaignIds = await this.prisma.metric.groupBy({
                by: ['campaignId'],
                where: {
                    tenantId,
                    platform: 'INSTAGRAM',
                    date: { gte: currentStartDate, lte: today },
                },
            });
            const ids = campaignIds.map((c) => c.campaignId);
            totalCampaigns = ids.length;
            activeCampaigns = ids.length
                ? await this.prisma.campaign.count({
                    where: { tenantId, status: client_1.CampaignStatus.ACTIVE, id: { in: ids } },
                })
                : 0;
        }
        else {
            totalCampaigns = await this.prisma.campaign.count({
                where: { tenantId, platform: platformEnum },
            });
            activeCampaigns = await this.prisma.campaign.count({
                where: { tenantId, status: client_1.CampaignStatus.ACTIVE, platform: platformEnum },
            });
        }
        const currentMetrics = await this.prisma.metric.aggregate({
            where: {
                tenantId,
                date: { gte: currentStartDate, lte: today },
                ...(platform !== 'ALL' ? { platform: platformEnum } : {}),
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: { impressions: true, clicks: true, spend: true, conversions: true },
        });
        const previousMetrics = await this.prisma.metric.aggregate({
            where: {
                tenantId,
                date: { gte: previousStartDate, lt: currentStartDate },
                ...(platform !== 'ALL' ? { platform: platformEnum } : {}),
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: { impressions: true, clicks: true, spend: true, conversions: true },
        });
        const calculateTrend = (current, previous) => {
            if (previous === 0)
                return 0;
            return ((current - previous) / previous) * 100;
        };
        const hasMockData = await this.prisma.metric.findFirst({
            where: {
                tenantId,
                date: { gte: currentStartDate, lte: today },
                ...(platform !== 'ALL' ? { platform: platformEnum } : {}),
                isMockData: true,
            },
        });
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
                spend: calculateTrend(toNumber(currentMetrics._sum.spend), toNumber(previousMetrics._sum.spend)),
                impressions: calculateTrend(currentMetrics._sum.impressions ?? 0, previousMetrics._sum.impressions ?? 0),
                clicks: calculateTrend(currentMetrics._sum.clicks ?? 0, previousMetrics._sum.clicks ?? 0),
            },
        };
    }
    async getTopCampaigns(tenantId, limit = 5, days = 30) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const { startDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const aggregatedMetrics = await this.prisma.metric.groupBy({
            by: ['campaignId'],
            where: {
                campaign: { tenantId },
                date: { gte: startDate },
                ...(hideMockData ? { isMockData: false } : {}),
            },
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
        const campaignIds = aggregatedMetrics.map(m => m.campaignId);
        const campaigns = await this.prisma.campaign.findMany({
            where: { id: { in: campaignIds }, tenantId },
            select: { id: true, name: true, platform: true, status: true },
        });
        const campaignMap = new Map(campaigns.map(c => [c.id, c]));
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
    async getTrends(tenantId, days = 30) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const { startDate, endDate: today } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const metrics = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                campaign: { tenantId },
                date: {
                    gte: startDate,
                    lte: today,
                },
                ...(hideMockData ? { isMockData: false } : {}),
            },
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
    async getOnboardingStatus(tenantId) {
        const googleAdsCount = await this.prisma.googleAdsAccount.count({
            where: { tenantId, status: 'ENABLED' },
        });
        const ga4Count = await this.prisma.googleAnalyticsAccount.count({
            where: { tenantId, status: 'ACTIVE' },
        });
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { settings: true },
        });
        let hasTargets = false;
        if (tenant?.settings) {
            try {
                const settings = typeof tenant.settings === 'string'
                    ? JSON.parse(tenant.settings)
                    : tenant.settings;
                hasTargets = !!settings?.kpiTargets;
            }
            catch (e) {
            }
        }
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
    async getPerformanceByPlatform(tenantId, days = 30, REAL) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const { startDate, endDate: today } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const platformMetrics = await this.prisma.metric.groupBy({
            by: ['platform'],
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: today,
                },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                spend: true,
                impressions: true,
                clicks: true,
                conversions: true,
            },
        });
        const platformData = {
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
        const ga4Metrics = await this.prisma.webAnalyticsDaily.aggregate({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: today,
                },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                sessions: true,
                activeUsers: true,
                newUsers: true,
                screenPageViews: true,
            },
        });
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
                spend: 0,
                impressions: ga4Metrics._sum.screenPageViews || 0,
                clicks: ga4Metrics._sum.sessions || 0,
                conversions: 0,
            },
        ];
    }
    async getOverview(user, query) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        let tenantId = user.tenantId;
        if (query.tenantId) {
            if (user.role !== client_1.UserRole.SUPER_ADMIN) {
                throw new common_1.ForbiddenException('Tenant override requires SUPER_ADMIN role');
            }
            tenantId = query.tenantId;
        }
        let startDate;
        let endDate;
        let period;
        if (query.startDate && query.endDate) {
            startDate = new Date(query.startDate);
            endDate = new Date(query.endDate);
            if (startDate > endDate) {
                throw new Error('startDate must be before or equal to endDate');
            }
            period = query.period || dashboard_overview_dto_1.PeriodEnum.SEVEN_DAYS;
        }
        else {
            period = query.period || dashboard_overview_dto_1.PeriodEnum.SEVEN_DAYS;
            const dateRange = date_range_util_1.DateRangeUtil.getDateRangeByPeriod(period);
            startDate = dateRange.startDate;
            endDate = dateRange.endDate;
        }
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const previousPeriod = {
            startDate: new Date(startDate.getTime() - daysDiff * 24 * 60 * 60 * 1000),
            endDate: new Date(startDate.getTime() - 1),
        };
        const currentMetrics = await this.prisma.metric.aggregate({
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
                revenue: true,
            },
        });
        const previousMetrics = await this.prisma.metric.aggregate({
            where: {
                tenantId,
                date: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
                revenue: true,
            },
        });
        const dailyMetrics = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
            },
            orderBy: { date: 'asc' },
        });
        const topCampaignMetrics = await this.prisma.metric.groupBy({
            by: ['campaignId'],
            where: {
                campaign: { tenantId },
                date: { gte: startDate, lte: endDate },
                ...(hideMockData ? { isMockData: false } : {}),
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
        const campaignIds = topCampaignMetrics.map(m => m.campaignId);
        let campaignDetails = [];
        if (campaignIds.length > 0) {
            campaignDetails = await this.prisma.campaign.findMany({
                where: { id: { in: campaignIds }, tenantId },
                select: { id: true, name: true, status: true, platform: true, budget: true }
            });
        }
        else {
            campaignDetails = await this.prisma.campaign.findMany({
                where: { tenantId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                select: { id: true, name: true, status: true, platform: true, budget: true }
            });
        }
        const campaignMap = new Map(campaignDetails.map(c => [c.id, c]));
        const recentCampaigns = campaignIds.length > 0
            ? topCampaignMetrics.map(m => {
                const c = campaignMap.get(m.campaignId);
                if (!c)
                    return null;
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
        const calculateTrend = (current, previous) => {
            if (previous === 0)
                return 0;
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
        const trends = dailyMetrics.map(m => ({
            date: m.date.toISOString().split('T')[0],
            cost: toNumber(m._sum.spend),
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
                recentCampaigns,
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map