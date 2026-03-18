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
exports.TrendAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_range_util_1 = require("../../common/utils/date-range.util");
const trend_analysis_dto_1 = require("./dto/trend-analysis.dto");
let TrendAnalysisService = class TrendAnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toNumber(value, defaultValue = 0) {
        if (value === null || value === undefined)
            return defaultValue;
        if (typeof value === 'object' && 'toNumber' in value)
            return value.toNumber();
        return Number(value);
    }
    async getTrends(tenantId, query) {
        const days = query.period === trend_analysis_dto_1.TrendPeriod.D7 ? 7 : 30;
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const metrics = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            _sum: {
                spend: true,
                impressions: true,
                clicks: true,
                conversions: true,
                revenue: true,
            },
            orderBy: { date: 'asc' },
        });
        const ga4Metrics = await this.prisma.webAnalyticsDaily.findMany({
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            select: {
                date: true,
                sessions: true,
            },
        });
        const ga4Map = new Map(ga4Metrics.map(m => [m.date.toISOString().split('T')[0], m.sessions]));
        return metrics.map(m => {
            const dateStr = m.date.toISOString().split('T')[0];
            return {
                date: dateStr,
                cost: this.toNumber(m._sum.spend),
                impressions: m._sum.impressions || 0,
                clicks: m._sum.clicks || 0,
                conversions: m._sum.conversions || 0,
                revenue: this.toNumber(m._sum.revenue),
                sessions: ga4Map.get(dateStr) || 0,
            };
        });
    }
};
exports.TrendAnalysisService = TrendAnalysisService;
exports.TrendAnalysisService = TrendAnalysisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrendAnalysisService);
//# sourceMappingURL=trend-analysis.service.js.map