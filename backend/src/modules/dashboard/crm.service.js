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
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_range_util_1 = require("../../common/utils/date-range.util");
const crm_summary_dto_1 = require("./dto/crm-summary.dto");
let CrmService = class CrmService {
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
    async getSummary(tenantId, query) {
        const days = query.period === crm_summary_dto_1.CrmPeriod.D7 ? 7 : 30;
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const { startDate: prevStartDate, endDate: prevEndDate } = date_range_util_1.DateRangeUtil.getPreviousPeriodDateRange(startDate, days);
        const currentMetrics = await this.prisma.metric.aggregate({
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            _sum: {
                conversions: true,
                spend: true,
                revenue: true,
            },
        });
        const prevMetrics = await this.prisma.metric.aggregate({
            where: {
                tenantId,
                date: { gte: prevStartDate, lte: prevEndDate },
            },
            _sum: {
                conversions: true,
                spend: true,
                revenue: true,
            },
        });
        const calculateTrend = (curr, prev) => {
            if (!prev)
                return 0;
            return Number(((curr - prev) / prev * 100).toFixed(1));
        };
        const totalLeads = this.toNumber(currentMetrics._sum.conversions);
        const prevLeads = this.toNumber(prevMetrics._sum.conversions);
        const qualifiedLeads = Math.floor(totalLeads * 0.4);
        const prevQualified = Math.floor(prevLeads * 0.4);
        const spend = this.toNumber(currentMetrics._sum.spend);
        const prevSpend = this.toNumber(prevMetrics._sum.spend);
        const cpl = totalLeads > 0 ? spend / totalLeads : 0;
        const prevCpl = prevLeads > 0 ? prevSpend / prevLeads : 0;
        const pipelineValue = this.toNumber(currentMetrics._sum.revenue);
        const prevPipeline = this.toNumber(prevMetrics._sum.revenue);
        return {
            totalLeads,
            leadsTrend: calculateTrend(totalLeads, prevLeads),
            qualifiedLeads,
            qualifiedTrend: calculateTrend(qualifiedLeads, prevQualified),
            conversionRate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
            conversionTrend: 0,
            costPerLead: cpl,
            cplTrend: calculateTrend(cpl, prevCpl),
            pipelineValue,
            pipelineTrend: calculateTrend(pipelineValue, prevPipeline),
        };
    }
    async getPipelineTrends(tenantId, days = 30) {
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const trends = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            _sum: {
                conversions: true,
                revenue: true,
            },
            orderBy: { date: 'asc' },
        });
        return trends.map(t => ({
            date: t.date.toISOString().split('T')[0],
            leads: t._sum.conversions || 0,
            value: this.toNumber(t._sum.revenue),
        }));
    }
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrmService);
//# sourceMappingURL=crm.service.js.map