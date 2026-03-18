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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsSeederService = exports.NoOpProgressReporter = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const provenance_constants_1 = require("../../common/provenance.constants");
const ad_simulator_engine_1 = require("../ad-simulator.engine");
const math_safety_util_1 = require("../../utils/math-safety.util");
const container_1 = require("../core/container");
const platform_mapper_1 = require("../core/platform.mapper");
const write_schema_preflight_1 = require("../core/write-schema-preflight");
class NoOpProgressReporter {
    start() { }
    update() { }
    stop() { }
}
exports.NoOpProgressReporter = NoOpProgressReporter;
let GoogleAdsSeederService = class GoogleAdsSeederService {
    constructor(logger, prisma) {
        this.logger = logger;
        this.prisma = prisma;
        this.engine = new ad_simulator_engine_1.AdSimulatorEngine();
    }
    async seed(tenantId, config, progressReporter = new NoOpProgressReporter()) {
        try {
            await this.assertSchemaParity();
            const dbPlatform = platform_mapper_1.PlatformMapper.toPersistence(config.platform);
            const tenant = await this.validateTenant(tenantId);
            if (!tenant) {
                return {
                    success: false,
                    status: 'error',
                    message: `Tenant ${tenantId} not found`,
                };
            }
            const dateRange = this.calculateDateRange(config.days);
            const campaigns = await this.findCampaigns(tenantId, dbPlatform);
            if (campaigns.length === 0) {
                return {
                    success: true,
                    status: 'no_campaigns',
                    message: `No campaigns found for platform ${config.platform}`,
                    data: {
                        tenantId: tenant.id,
                        tenantName: tenant.name,
                        seededCount: 0,
                        campaignCount: 0,
                        dateRange: {
                            start: dateRange.start.toISOString().slice(0, 10),
                            end: dateRange.end.toISOString().slice(0, 10),
                        },
                        campaigns: [],
                    },
                };
            }
            const seedResult = await this.seedMetrics(campaigns, dateRange, config, progressReporter);
            return {
                success: true,
                status: 'completed',
                message: `Successfully seeded ${seedResult.totalSeeded} rows for ${campaigns.length} campaigns.`,
                data: {
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    seededCount: seedResult.totalSeeded,
                    campaignCount: campaigns.length,
                    dateRange: {
                        start: dateRange.start.toISOString().slice(0, 10),
                        end: dateRange.end.toISOString().slice(0, 10),
                    },
                    campaigns: seedResult.campaigns,
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                status: 'error',
                message: 'Seeding failed',
                error: errorMessage,
            };
        }
    }
    async assertSchemaParity() {
        await (0, write_schema_preflight_1.assertToolkitWriteSchemaParity)(this.prisma);
    }
    async validateTenant(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true },
        });
        return tenant;
    }
    calculateDateRange(days) {
        const now = new Date();
        const todayUtc = this.toUtcDateOnly(now);
        const endDate = this.addUtcDays(todayUtc, -1);
        const startDate = this.addUtcDays(todayUtc, -days);
        return { start: startDate, end: endDate };
    }
    async findCampaigns(tenantId, platform) {
        return this.prisma.campaign.findMany({
            where: {
                tenantId,
                platform,
            },
            select: {
                id: true,
                tenantId: true,
                name: true,
            },
        });
    }
    async seedMetrics(campaigns, dateRange, config, progressReporter) {
        const totalDays = this.calculateDaysBetween(dateRange.start, dateRange.end);
        const totalWork = campaigns.length * totalDays;
        progressReporter.start(totalWork);
        const seededCampaigns = [];
        let totalSeededCount = 0;
        let progressCount = 0;
        for (const campaign of campaigns) {
            await this.prisma.metric.deleteMany({
                where: {
                    campaignId: campaign.id,
                    platform: config.platform,
                    source: config.seedSource,
                    date: { gte: dateRange.start, lte: dateRange.end },
                },
            });
            const trendProfile = this.getRandomTrendProfile();
            const baseImpressions = this.randomBaseImpressions();
            const simulatedData = this.engine.generateDateRangeMetrics(dateRange.start, dateRange.end, trendProfile, baseImpressions, config.platform);
            const rows = simulatedData.map(({ date, metrics }) => {
                progressCount++;
                progressReporter.update(progressCount, campaign.name.slice(0, 20));
                return this.buildMetricRow(campaign, date, metrics, config);
            });
            const createResult = await this.prisma.metric.createMany({ data: rows });
            seededCampaigns.push({
                id: campaign.id,
                name: campaign.name,
                rowsCreated: createResult.count,
                trendProfile,
            });
            totalSeededCount += createResult.count;
        }
        progressReporter.stop();
        return { totalSeeded: totalSeededCount, campaigns: seededCampaigns };
    }
    buildMetricRow(campaign, date, metrics, config) {
        return {
            tenantId: campaign.tenantId,
            campaignId: campaign.id,
            date,
            platform: config.platform,
            source: provenance_constants_1.PROVENANCE.SOURCE_TOOLKIT_GADS,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            conversions: metrics.conversions,
            orders: metrics.conversions,
            spend: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.cost).toFixed(2)),
            revenue: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.revenue).toFixed(2)),
            averageOrderValue: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.aov).toFixed(2)),
            ctr: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.ctr).toFixed(4)),
            costPerClick: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.cpc).toFixed(4)),
            conversionRate: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.cvr).toFixed(4)),
            roas: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.roas).toFixed(4)),
            costPerMille: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.impressions > 0 ? (metrics.cost / metrics.impressions) * 1000 : 0).toFixed(4)),
            costPerAction: new client_1.Prisma.Decimal((0, math_safety_util_1.safeFloat)(metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0).toFixed(4)),
            isMockData: true,
        };
    }
    toUtcDateOnly(date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    }
    addUtcDays(date, days) {
        const d = new Date(date);
        d.setUTCDate(d.getUTCDate() + days);
        return d;
    }
    calculateDaysBetween(start, end) {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
    }
    getRandomTrendProfile() {
        const roll = Math.random();
        if (roll < 0.4)
            return 'GROWTH';
        if (roll < 0.7)
            return 'DECLINE';
        return 'STABLE';
    }
    randomBaseImpressions() {
        return Math.floor(Math.random() * 1400) + 800;
    }
};
exports.GoogleAdsSeederService = GoogleAdsSeederService;
exports.GoogleAdsSeederService = GoogleAdsSeederService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __param(1, (0, tsyringe_1.inject)(container_1.TOKENS.PrismaClient)),
    __metadata("design:paramtypes", [Object, client_1.PrismaClient])
], GoogleAdsSeederService);
//# sourceMappingURL=google-ads-seeder.service.js.map