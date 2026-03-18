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
var EcommerceRollupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcommerceRollupService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
let EcommerceRollupService = EcommerceRollupService_1 = class EcommerceRollupService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EcommerceRollupService_1.name);
    }
    dateKey(d) {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    stableNumber(seed) {
        let h = 2166136261;
        for (let i = 0; i < seed.length; i++) {
            h ^= seed.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0) / 4294967295;
    }
    clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }
    async backfillLastNDaysForAllTenants(days = 30) {
        const tenants = await this.prisma.tenant.findMany({ select: { id: true, name: true } });
        for (const t of tenants) {
            try {
                await this.backfillLastNDaysForTenant(t.id, days);
            }
            catch (e) {
                this.logger.error(`Failed Ecommerce backfill for tenant ${t.id} (${t.name})`, e instanceof Error ? e.stack : e);
            }
        }
    }
    async backfillLastNDaysForTenant(tenantId, days = 30) {
        const safeDays = Math.max(1, Math.floor(days));
        const end = new Date();
        end.setUTCHours(0, 0, 0, 0);
        end.setUTCDate(end.getUTCDate() - 1);
        const start = new Date(end);
        start.setUTCDate(start.getUTCDate() - (safeDays - 1));
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
            await this.upsertDailyEcommerceForTenant(tenantId, new Date(d));
        }
    }
    async upsertDailyEcommerceForTenant(tenantId, date) {
        const day = new Date(date);
        day.setUTCHours(0, 0, 0, 0);
        const key = this.dateKey(day);
        const base = this.stableNumber(`${tenantId}:${key}`);
        let campaign = await this.prisma.campaign.findFirst({
            where: { tenantId, name: 'Ecommerce Mock Campaign' }
        });
        if (!campaign) {
            campaign = await this.prisma.campaign.create({
                data: {
                    tenantId,
                    name: 'Ecommerce Mock Campaign',
                    platform: 'GOOGLE_ADS',
                    status: 'ACTIVE',
                    budget: new client_1.Prisma.Decimal(10000),
                }
            });
        }
        const sessions = Math.floor(1000 + base * 5000);
        const orders = Math.floor(sessions * (0.02 + this.stableNumber(`${tenantId}:${key}:orders`) * 0.03));
        const revenue = orders * (500 + this.stableNumber(`${tenantId}:${key}:revenue`) * 1500);
        const aov = orders > 0 ? revenue / orders : 0;
        const cr = sessions > 0 ? (orders / sessions) * 100 : 0;
        const car = 0.65 + this.stableNumber(`${tenantId}:${key}:car`) * 0.15;
        const existingMetric = await this.prisma.metric.findFirst({
            where: {
                campaignId: campaign.id,
                date: day,
            },
            select: { id: true }
        });
        const metricData = {
            tenantId,
            campaignId: campaign.id,
            date: day,
            revenue: new client_1.Prisma.Decimal(revenue.toFixed(2)),
            orders,
            averageOrderValue: new client_1.Prisma.Decimal(aov.toFixed(2)),
            conversionRate: new client_1.Prisma.Decimal(cr.toFixed(4)),
            cartAbandonmentRate: new client_1.Prisma.Decimal(car.toFixed(4)),
            isMockData: false,
            platform: campaign.platform,
        };
        if (existingMetric) {
            await this.prisma.metric.update({
                where: { id: existingMetric.id },
                data: metricData,
            });
        }
        else {
            await this.prisma.metric.create({
                data: metricData,
            });
        }
    }
};
exports.EcommerceRollupService = EcommerceRollupService;
exports.EcommerceRollupService = EcommerceRollupService = EcommerceRollupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EcommerceRollupService);
//# sourceMappingURL=ecommerce-rollup.service.js.map