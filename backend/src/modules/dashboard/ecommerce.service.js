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
exports.EcommerceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_range_util_1 = require("../../common/utils/date-range.util");
const ecommerce_summary_dto_1 = require("./dto/ecommerce-summary.dto");
let EcommerceService = class EcommerceService {
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
        const days = query.period === ecommerce_summary_dto_1.EcommercePeriod.D7 ? 7 : 30;
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const { startDate: prevStartDate, endDate: prevEndDate } = date_range_util_1.DateRangeUtil.getPreviousPeriodDateRange(startDate, days);
        const currentMetrics = await this.prisma.metric.aggregate({
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            _sum: {
                revenue: true,
                orders: true,
                spend: true,
            },
            _avg: {
                averageOrderValue: true,
                conversionRate: true,
                cartAbandonmentRate: true,
            },
        });
        const prevMetrics = await this.prisma.metric.aggregate({
            where: {
                tenantId,
                date: { gte: prevStartDate, lte: prevEndDate },
            },
            _sum: {
                revenue: true,
                orders: true,
            },
            _avg: {
                averageOrderValue: true,
                conversionRate: true,
                cartAbandonmentRate: true,
            },
        });
        const calculateTrend = (curr, prev) => {
            if (!prev)
                return 0;
            return Number(((curr - prev) / prev * 100).toFixed(1));
        };
        const totalRevenue = this.toNumber(currentMetrics._sum.revenue);
        const prevRevenue = this.toNumber(prevMetrics._sum.revenue);
        const totalOrders = currentMetrics._sum.orders || 0;
        const prevOrders = prevMetrics._sum.orders || 0;
        const aov = this.toNumber(currentMetrics._avg.averageOrderValue);
        const prevAov = this.toNumber(prevMetrics._avg.averageOrderValue);
        const cr = this.toNumber(currentMetrics._avg.conversionRate);
        const prevCr = this.toNumber(prevMetrics._avg.conversionRate);
        const car = this.toNumber(currentMetrics._avg.cartAbandonmentRate);
        const prevCar = this.toNumber(prevMetrics._avg.cartAbandonmentRate);
        return {
            totalRevenue,
            revenueTrend: calculateTrend(totalRevenue, prevRevenue),
            totalOrders,
            ordersTrend: calculateTrend(totalOrders, prevOrders),
            averageOrderValue: aov,
            aovTrend: calculateTrend(aov, prevAov),
            conversionRate: cr,
            crTrend: calculateTrend(cr, prevCr),
            cartAbandonmentRate: car,
            abandonmentTrend: calculateTrend(car, prevCar),
        };
    }
    async getSalesTrends(tenantId, days = 30) {
        const { startDate, endDate } = date_range_util_1.DateRangeUtil.getDateRange(days);
        const trends = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            _sum: {
                revenue: true,
                orders: true,
            },
            orderBy: { date: 'asc' },
        });
        return trends.map(t => ({
            date: t.date.toISOString().split('T')[0],
            revenue: this.toNumber(t._sum.revenue),
            orders: t._sum.orders || 0,
        }));
    }
};
exports.EcommerceService = EcommerceService;
exports.EcommerceService = EcommerceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EcommerceService);
//# sourceMappingURL=ecommerce.service.js.map