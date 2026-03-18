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
exports.SeedDataCommandHandler = exports.SeedDataCommand = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const provenance_constants_1 = require("../../common/provenance.constants");
const contracts_1 = require("../core/contracts");
const container_1 = require("../core/container");
const ad_simulator_engine_1 = require("../ad-simulator.engine");
const platform_types_1 = require("../domain/platform.types");
const platform_mapper_1 = require("../core/platform.mapper");
const services_1 = require("../services");
const platform_capabilities_1 = require("../domain/platform-capabilities");
const contracts_2 = require("../core/contracts");
const write_schema_preflight_1 = require("../core/write-schema-preflight");
class SeederError extends contracts_2.ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'SEEDER_ERROR';
        this.isRecoverable = true;
    }
}
class SeedDataCommand {
    constructor(params) {
        this.params = params;
        this.name = (0, contracts_1.createCommandName)('seed-data');
        this.description = 'Seed mock metric data for a specific platform';
        this.requiresConfirmation = true;
    }
}
exports.SeedDataCommand = SeedDataCommand;
let SeedDataCommandHandler = class SeedDataCommandHandler {
    constructor(logger, prisma, seeder) {
        this.logger = logger;
        this.prisma = prisma;
        this.seeder = seeder;
        this.engine = new ad_simulator_engine_1.AdSimulatorEngine();
    }
    canHandle(command) {
        return command.name === 'seed-data';
    }
    async execute(command, context) {
        const { platform, days, trend, injectAnomaly } = command.params;
        this.logger.info(`Starting data seeding for ${platform}...`);
        await (0, write_schema_preflight_1.assertToolkitWriteSchemaParity)(this.prisma);
        const config = {
            days,
            platform,
            seedSource: 'cli-manual'
        };
        if (context.dryRun) {
            this.logger.info('Dry run mode - skipping writes', {
                platform,
                days,
                trend,
                injectAnomaly,
            });
            return contracts_1.Result.success({
                platform,
                campaignId: 'DRY_RUN',
                recordsCreated: 0,
                dateRange: { start: new Date(), end: new Date() },
                anomalyInjected: false,
            });
        }
        if (command.params.platform === platform_types_1.ToolkitPlatform.GoogleAds) {
            const seedResult = await this.seeder.seed(context.tenantId, config);
            if (!seedResult.success) {
                return contracts_1.Result.failure(new SeederError(seedResult.error || seedResult.message));
            }
            return contracts_1.Result.success({
                platform: command.params.platform,
                campaignId: 'multiple',
                recordsCreated: seedResult.data?.seededCount || 0,
                dateRange: seedResult.data?.dateRange ? {
                    start: new Date(seedResult.data.dateRange.start),
                    end: new Date(seedResult.data.dateRange.end)
                } : { start: new Date(), end: new Date() },
                anomalyInjected: false
            });
        }
        return this.manualSeed(command, context);
    }
    getMetadata() {
        return {
            name: 'seed-data',
            displayName: 'Seed Single Platform (Mock)',
            description: 'Generate synthetic metric history for one selected platform',
            icon: '🌱',
            category: 'data',
            estimatedDurationSeconds: 15,
            risks: ['Writes to Current Tenant DB', 'May duplicate data if run multiple times']
        };
    }
    validate(command) {
        const errors = [];
        if (!command.params.platform) {
            errors.push({ field: 'platform', message: 'Platform is required' });
        }
        else if (!platform_capabilities_1.SEEDABLE_PLATFORMS.includes(command.params.platform)) {
            errors.push({ field: 'platform', message: `Unsupported platform: ${command.params.platform}` });
        }
        if (command.params.days < 1 || command.params.days > 365) {
            errors.push({ field: 'days', message: 'Days must be between 1 and 365' });
        }
        if (errors.length > 0) {
            return contracts_1.Result.failure(new contracts_1.ValidationError('Seed data validation failed', errors));
        }
        return contracts_1.Result.success(undefined);
    }
    async findOrCreateCampaign(tenantId, platform) {
        const existing = await this.prisma.campaign.findFirst({
            where: {
                tenantId,
                platform,
                externalId: `toolkit-seed-${platform.toLowerCase()}`,
            },
        });
        if (existing)
            return existing;
        return this.prisma.campaign.create({
            data: {
                tenantId,
                name: `Toolkit Seed - ${platform}`,
                platform,
                status: 'ACTIVE',
                externalId: `toolkit-seed-${platform.toLowerCase()}`,
                budget: 100000,
                budgetType: 'DAILY',
                currency: 'THB',
            },
        });
    }
    async injectAnomaly(tenantId, campaignId, date, platform) {
        await this.prisma.metric.create({
            data: {
                tenantId,
                campaignId,
                date,
                platform,
                source: provenance_constants_1.PROVENANCE.SOURCE_TOOLKIT_SEED,
                isMockData: true,
                impressions: 100000,
                clicks: 5000,
                spend: 50000,
                conversions: 0,
                revenue: 0,
                ctr: 0.05,
                costPerClick: 10,
                conversionRate: 0,
                roas: 0,
            },
        });
    }
    async manualSeed(command, context) {
        const { platform, days, trend, injectAnomaly } = command.params;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (days - 1));
        const dbPlatform = platform_mapper_1.PlatformMapper.toPersistence(platform);
        const campaign = await this.findOrCreateCampaign(context.tenantId, dbPlatform);
        const metrics = this.engine.generateDateRangeMetrics(startDate, endDate, trend, 10000, platform);
        let recordsCreated = 0;
        for (const { date, metrics: m } of metrics) {
            await this.prisma.metric.create({
                data: {
                    tenantId: context.tenantId,
                    campaignId: campaign.id,
                    date,
                    platform: dbPlatform,
                    source: provenance_constants_1.PROVENANCE.SOURCE_TOOLKIT_SEED,
                    impressions: m.impressions,
                    clicks: m.clicks,
                    spend: m.cost,
                    conversions: m.conversions,
                    revenue: m.revenue,
                    ctr: m.ctr,
                    costPerClick: m.cpc,
                    conversionRate: m.cvr,
                    roas: m.roas,
                    isMockData: true,
                },
            });
            recordsCreated++;
        }
        let anomalyInjected = false;
        if (injectAnomaly) {
            await this.injectAnomaly(context.tenantId, campaign.id, endDate, dbPlatform);
            anomalyInjected = true;
            recordsCreated++;
        }
        return contracts_1.Result.success({
            platform,
            campaignId: campaign.id,
            recordsCreated,
            dateRange: { start: startDate, end: endDate },
            anomalyInjected,
        });
    }
};
exports.SeedDataCommandHandler = SeedDataCommandHandler;
exports.SeedDataCommandHandler = SeedDataCommandHandler = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __param(1, (0, tsyringe_1.inject)(container_1.TOKENS.PrismaClient)),
    __param(2, (0, tsyringe_1.inject)(services_1.GoogleAdsSeederService)),
    __metadata("design:paramtypes", [Object, client_1.PrismaClient,
        services_1.GoogleAdsSeederService])
], SeedDataCommandHandler);
//# sourceMappingURL=seed-data.command.js.map