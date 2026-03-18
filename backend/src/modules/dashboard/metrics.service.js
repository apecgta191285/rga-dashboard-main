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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_range_util_1 = require("../../common/utils/date-range.util");
function toNumber(value, defaultValue = 0) {
    if (value === null || value === undefined)
        return defaultValue;
    if (typeof value === 'object' && 'toNumber' in value)
        return value.toNumber();
    return Number(value);
}
let MetricsService = class MetricsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMetricsTrends(tenantId, period, compareWith) {
        const days = date_range_util_1.DateRangeUtil.parsePeriodDays(period);
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const currentMetrics = await this.getAggregatedMetrics(tenantId, startDate, endDate);
        let previousMetrics = null;
        if (compareWith === 'previous_period') {
            const { startDate: prevStartDate, endDate: prevEndDate } = date_range_util_1.DateRangeUtil.getPreviousPeriodDateRange(startDate, days);
            previousMetrics = await this.getAggregatedMetrics(tenantId, prevStartDate, prevEndDate);
        }
        const trends = this.calculateTrends(currentMetrics, previousMetrics);
        return {
            period,
            startDate,
            endDate,
            current: currentMetrics,
            previous: previousMetrics,
            trends,
        };
    }
    async getAggregatedMetrics(tenantId, startDate, endDate) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const result = await this.prisma.metric.aggregate({
            where: {
                campaign: { tenantId },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
                revenue: true,
            },
            _avg: {
                roas: true,
            },
        });
        const webResult = await this.prisma.webAnalyticsDaily.aggregate({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: {
                sessions: true,
            },
        });
        const totalImpressions = result._sum.impressions ?? 0;
        const totalClicks = result._sum.clicks ?? 0;
        const totalSpend = toNumber(result._sum.spend);
        const totalConversions = result._sum.conversions ?? 0;
        const totalRevenue = toNumber(result._sum.revenue);
        const totalSessions = webResult._sum.sessions ?? 0;
        return {
            impressions: totalImpressions,
            clicks: totalClicks,
            spend: totalSpend,
            conversions: totalConversions,
            revenue: totalRevenue,
            sessions: totalSessions,
            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
            cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
            roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        };
    }
    calculateTrends(current, previous) {
        if (!previous)
            return null;
        const calculateChange = (curr, prev) => {
            if (prev === 0)
                return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };
        return {
            impressions: calculateChange(current.impressions, previous.impressions),
            clicks: calculateChange(current.clicks, previous.clicks),
            spend: calculateChange(current.spend, previous.spend),
            conversions: calculateChange(current.conversions, previous.conversions),
            revenue: calculateChange(current.revenue, previous.revenue),
            sessions: calculateChange(current.sessions, previous.sessions),
            ctr: calculateChange(current.ctr, previous.ctr),
            cpc: calculateChange(current.cpc, previous.cpc),
            roas: calculateChange(current.roas, previous.roas),
        };
    }
    async getDailyMetrics(tenantId, period) {
        const days = date_range_util_1.DateRangeUtil.parsePeriodDays(period);
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        const metrics = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                campaign: { tenantId },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
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
                date: 'asc',
            },
        });
        return {
            period,
            startDate,
            endDate,
            data: metrics.map((m) => {
                const impressions = m._sum.impressions ?? 0;
                const clicks = m._sum.clicks ?? 0;
                const spend = toNumber(m._sum.spend);
                const revenue = toNumber(m._sum.revenue);
                return {
                    date: m.date,
                    impressions,
                    clicks,
                    spend,
                    conversions: m._sum.conversions ?? 0,
                    revenue,
                    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                    roas: spend > 0 ? revenue / spend : 0,
                };
            }),
        };
    }
    async getTimeSeries(tenantId, metric, startDate, endDate) {
        const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
        if (metric === 'sessions') {
            const rows = await this.prisma.webAnalyticsDaily.groupBy({
                by: ['date'],
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    ...(hideMockData ? { isMockData: false } : {}),
                },
                _sum: {
                    sessions: true,
                },
                orderBy: {
                    date: 'asc',
                },
            });
            return {
                metric,
                startDate,
                endDate,
                data: rows.map((r) => ({
                    date: r.date.toISOString().split('T')[0],
                    value: r._sum.sessions ?? 0,
                })),
            };
        }
        if (metric === 'impressions') {
            const rows = await this.prisma.metric.groupBy({
                by: ['date'],
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    ...(hideMockData ? { isMockData: false } : {}),
                },
                _sum: { impressions: true },
                orderBy: {
                    date: 'asc',
                },
            });
            return {
                metric,
                startDate,
                endDate,
                data: rows.map((r) => ({
                    date: r.date.toISOString().split('T')[0],
                    value: r._sum.impressions ?? 0,
                })),
            };
        }
        if (metric === 'clicks') {
            const rows = await this.prisma.metric.groupBy({
                by: ['date'],
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    ...(hideMockData ? { isMockData: false } : {}),
                },
                _sum: { clicks: true },
                orderBy: {
                    date: 'asc',
                },
            });
            return {
                metric,
                startDate,
                endDate,
                data: rows.map((r) => ({
                    date: r.date.toISOString().split('T')[0],
                    value: r._sum.clicks ?? 0,
                })),
            };
        }
        if (metric === 'conversions') {
            const rows = await this.prisma.metric.groupBy({
                by: ['date'],
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    ...(hideMockData ? { isMockData: false } : {}),
                },
                _sum: { conversions: true },
                orderBy: {
                    date: 'asc',
                },
            });
            return {
                metric,
                startDate,
                endDate,
                data: rows.map((r) => ({
                    date: r.date.toISOString().split('T')[0],
                    value: r._sum.conversions ?? 0,
                })),
            };
        }
        if (metric === 'spend') {
            const rows = await this.prisma.metric.groupBy({
                by: ['date'],
                where: {
                    tenantId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    ...(hideMockData ? { isMockData: false } : {}),
                },
                _sum: { spend: true },
                orderBy: {
                    date: 'asc',
                },
            });
            return {
                metric,
                startDate,
                endDate,
                data: rows.map((r) => ({
                    date: r.date.toISOString().split('T')[0],
                    value: toNumber(r._sum.spend),
                })),
            };
        }
        const rows = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(hideMockData ? { isMockData: false } : {}),
            },
            _sum: { revenue: true },
            orderBy: {
                date: 'asc',
            },
        });
        return {
            metric,
            startDate,
            endDate,
            data: rows.map((r) => ({
                date: r.date.toISOString().split('T')[0],
                value: toNumber(r._sum.revenue),
            })),
        };
    }
    async getCampaignPerformance(campaignId, startDate, endDate) {
        const metrics = await this.prisma.metric.findMany({
            where: {
                campaignId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                date: 'asc',
            },
        });
        const totals = metrics.reduce((acc, m) => ({
            impressions: acc.impressions + (m.impressions ?? 0),
            clicks: acc.clicks + (m.clicks ?? 0),
            spend: acc.spend + toNumber(m.spend),
            conversions: acc.conversions + toNumber(m.conversions),
            revenue: acc.revenue + toNumber(m.revenue),
        }), {
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0,
            revenue: 0,
        });
        return {
            campaignId,
            startDate,
            endDate,
            totals: {
                ...totals,
                ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
                cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
                roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
            },
            daily: metrics.map((m) => {
                const impressions = m.impressions ?? 0;
                const clicks = m.clicks ?? 0;
                const spend = toNumber(m.spend);
                const revenue = toNumber(m.revenue);
                const roas = toNumber(m.roas);
                return {
                    date: m.date,
                    impressions,
                    clicks,
                    spend,
                    conversions: m.conversions ?? 0,
                    revenue,
                    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                    cpc: clicks > 0 ? spend / clicks : 0,
                    roas,
                };
            }),
        };
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map