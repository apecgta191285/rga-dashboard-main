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
exports.VerificationRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let VerificationRepository = class VerificationRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async countMetrics(tenantId, windowStart, windowEnd) {
        return this.prisma.metric.count({
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: 'toolkit:' },
                date: {
                    gte: windowStart,
                    lte: windowEnd,
                },
            },
        });
    }
    async countDriftMetrics(tenantId, windowStart, windowEnd) {
        return this.prisma.metric.count({
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: 'toolkit:' },
                NOT: {
                    date: {
                        gte: windowStart,
                        lte: windowEnd,
                    },
                },
            },
        });
    }
    async checkMockFlagConsistency(tenantId) {
        return this.prisma.metric.count({
            where: {
                tenantId,
                source: { startsWith: 'toolkit:' },
                isMockData: false,
            },
        });
    }
    async getAggregates(tenantId, windowStart, windowEnd) {
        const metrics = await this.prisma.metric.groupBy({
            by: ['campaignId', 'platform'],
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: 'toolkit:' },
                date: {
                    gte: windowStart,
                    lte: windowEnd,
                },
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
                revenue: true,
            },
        });
        if (metrics.length === 0)
            return [];
        const campaignIds = metrics.map(m => m.campaignId);
        const campaigns = await this.prisma.campaign.findMany({
            where: { id: { in: campaignIds }, tenantId },
            select: { id: true, name: true, budget: true, budgetType: true },
        });
        const campaignMap = new Map(campaigns.map(c => [c.id, c]));
        return metrics.map(m => {
            const c = campaignMap.get(m.campaignId);
            const totals = m._sum;
            return {
                campaignId: m.campaignId,
                campaignName: c?.name || 'Unknown',
                platform: m.platform,
                budget: c?.budget ? Number(c.budget) : 0,
                budgetType: c?.budgetType || 'DAILY',
                impressions: totals.impressions || 0,
                clicks: totals.clicks || 0,
                spend: totals.spend ? Number(totals.spend) : 0,
                conversions: totals.conversions || 0,
                revenue: totals.revenue ? Number(totals.revenue) : 0,
            };
        });
    }
};
exports.VerificationRepository = VerificationRepository;
exports.VerificationRepository = VerificationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], VerificationRepository);
//# sourceMappingURL=verification.repository.js.map