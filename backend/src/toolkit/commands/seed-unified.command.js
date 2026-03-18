"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedUnifiedCommandHandler = exports.SeedUnifiedCommand = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const crypto = __importStar(require("crypto"));
const contracts_1 = require("../core/contracts");
const constants_1 = require("../core/constants");
const container_1 = require("../core/container");
const ad_simulator_engine_1 = require("../ad-simulator.engine");
const platform_mapper_1 = require("../core/platform.mapper");
const platform_capabilities_1 = require("../domain/platform-capabilities");
const platform_utils_1 = require("../domain/platform-utils");
const manifest_1 = require("../manifest");
const scenario_loader_1 = require("../scenarios/scenario-loader");
const fixture_provider_1 = require("../fixtures/fixture-provider");
const write_schema_preflight_1 = require("../core/write-schema-preflight");
class SeedUnifiedCommand {
    constructor(params) {
        this.params = params;
        this.name = (0, contracts_1.createCommandName)('seed-unified-scenario');
        this.description = 'Deterministic multi-platform seeding with strict provenance';
        this.requiresConfirmation = true;
    }
}
exports.SeedUnifiedCommand = SeedUnifiedCommand;
class HygieneError extends contracts_1.ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'HYGIENE_VIOLATION';
        this.isRecoverable = false;
    }
}
class SeedUnifiedExecutionError extends contracts_1.ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'SEED_UNIFIED_EXECUTION_FAILED';
        this.isRecoverable = false;
    }
}
let SeedUnifiedCommandHandler = class SeedUnifiedCommandHandler {
    constructor(logger, prisma, scenarioLoader, fixtureProvider) {
        this.logger = logger;
        this.prisma = prisma;
        this.scenarioLoader = scenarioLoader;
        this.fixtureProvider = fixtureProvider;
        this.engine = new ad_simulator_engine_1.AdSimulatorEngine();
    }
    getMetadata() {
        return {
            name: 'seed-unified-scenario',
            displayName: 'Seed Unified Scenario',
            description: 'Deterministic multi-platform seeding with strict provenance and hygiene',
            icon: '🌐',
            category: 'data',
            estimatedDurationSeconds: 30,
            risks: ['Writes mock data to current tenant', 'Deletes existing mock data for same source tag'],
        };
    }
    validate(command) {
        if (!command.params.tenant) {
            return contracts_1.Result.failure(new HygieneError('Tenant ID is required'));
        }
        if (!command.params.scenario) {
            return contracts_1.Result.failure(new HygieneError('Scenario is required'));
        }
        if (command.params.seed === undefined || command.params.seed === null) {
            return contracts_1.Result.failure(new HygieneError('Seed is required'));
        }
        if (command.params.days !== undefined && (command.params.days < 1 || command.params.days > 365)) {
            return contracts_1.Result.failure(new HygieneError('Days must be between 1 and 365'));
        }
        return contracts_1.Result.success(undefined);
    }
    canHandle(command) {
        return command.name === 'seed-unified-scenario';
    }
    async execute(command, context) {
        const params = {
            ...command.params,
            dryRun: context.dryRun,
        };
        const result = await this.runWithManifest(params);
        if (result.status === 'BLOCKED') {
            return contracts_1.Result.failure(new SeedUnifiedExecutionError(`Seed unified blocked by safety/policy gate (exit ${result.exitCode})`));
        }
        if (result.status === 'FAILED') {
            return contracts_1.Result.failure(new SeedUnifiedExecutionError(`Seed unified failed (exit ${result.exitCode})`));
        }
        return contracts_1.Result.success({
            rowsCreated: result.manifest?.results?.writesApplied?.actualCounts?.['totalRows'] ?? 0,
            platformsProcessed: [],
            sourceTag: `toolkit:unified:${params.scenario}:${params.seed}`,
            manifestPath: result.manifestPath,
            manifest: result.manifest,
        });
    }
    async runWithManifest(params, manifestDir) {
        const { tenant, scenario, seed, mode, days = 30, platforms, dryRun, allowRealTenant } = params;
        const sourceTag = `toolkit:unified:${scenario}:${seed}`;
        return (0, manifest_1.executeWithManifest)({
            config: {
                executionMode: 'CLI',
                commandName: 'seed-unified-scenario',
                commandClassification: 'WRITE',
                args: { tenant, scenario, mode, seed, days, platforms, dryRun, allowRealTenant },
                flags: {
                    dryRun: dryRun,
                    noDryRun: !dryRun,
                    force: false,
                    yes: false,
                    verbose: true,
                    manifestDir: manifestDir ?? null,
                    seed: String(seed),
                    scenario: scenario,
                },
            },
            manifestDir,
            execute: async (builder) => {
                return this.executeCore(builder, params);
            },
        });
    }
    async executeCore(builder, params) {
        const { tenant, scenario, seed, mode, days = 30, platforms, dryRun, allowRealTenant } = params;
        const sourceTag = `toolkit:unified:${scenario}:${seed}`;
        let targetPlatforms = platform_capabilities_1.SEEDABLE_PLATFORMS;
        const hygieneStep = builder.startStep('VALIDATE_INPUT');
        try {
            targetPlatforms = this.resolveTargetPlatforms(platforms);
            await this.ensureSchemaParity();
            if (!dryRun) {
                await this.enforceHygiene(tenant, allowRealTenant);
            }
            hygieneStep.close({
                status: 'SUCCESS',
                summary: dryRun
                    ? `Schema parity verified (dry-run). Hygiene check skipped. Platforms: ${targetPlatforms.join(', ')}`
                    : 'Schema parity verified and tenant is clean (or override active)',
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const code = err instanceof write_schema_preflight_1.SchemaParityPreflightError ? 'SCHEMA_PARITY_VIOLATION' : 'HYGIENE_VIOLATION';
            hygieneStep.close({
                status: 'FAILED',
                summary: msg,
                error: {
                    code,
                    message: msg,
                    isRecoverable: false,
                },
            });
            return { status: 'BLOCKED', exitCode: 78 };
        }
        const loadStep = builder.startStep('LOAD_SCENARIO');
        let scenarioSpec;
        try {
            scenarioSpec = await this.scenarioLoader.load(scenario);
            loadStep.close({
                status: 'SUCCESS',
                summary: `Loaded scenario "${scenarioSpec.name}" (ID: ${scenarioSpec.scenarioId}, Trend: ${scenarioSpec.trend})`,
            });
        }
        catch (err) {
            const error = err;
            loadStep.close({
                status: 'FAILED',
                summary: error.message,
                error: {
                    code: error.code || 'SCENARIO_LOAD_ERROR',
                    message: error.message,
                    isRecoverable: false
                }
            });
            return { status: 'BLOCKED', exitCode: error.exitCode || 2 };
        }
        const validateStep = builder.startStep('VALIDATE_SCENARIO');
        validateStep.close({
            status: 'SUCCESS',
            summary: `Schema ${scenarioSpec.schemaVersion} valid`
        });
        const fixtureStep = builder.startStep('LOAD_FIXTURES');
        let goldenFixture = null;
        if (mode === 'GENERATED') {
            fixtureStep.close({
                status: 'SKIPPED',
                summary: 'Mode is GENERATED - skipping fixture load'
            });
        }
        else {
            try {
                goldenFixture = await this.fixtureProvider.loadFixture(scenarioSpec.scenarioId, seed);
                fixtureStep.close({
                    status: 'SUCCESS',
                    summary: `Loaded golden fixture for ${scenarioSpec.scenarioId} (Seed: ${seed})`
                });
            }
            catch (err) {
                const error = err;
                fixtureStep.close({
                    status: 'FAILED',
                    summary: error.message,
                    error: {
                        code: error.code || 'FIXTURE_LOAD_ERROR',
                        message: error.message,
                        isRecoverable: false
                    }
                });
                return { status: 'BLOCKED', exitCode: error.exitCode || 2 };
            }
        }
        const baseSeedHash = crypto.createHash('sha256')
            .update(`${tenant}:${scenarioSpec.scenarioId}:${seed}`)
            .digest('hex');
        let totalPlannedRows = 0;
        let totalAppliedRows = 0;
        const processedPlatforms = [];
        const perPlatformShape = {};
        const sortedPlatforms = [...targetPlatforms].sort();
        const anchorDate = scenarioSpec.dateAnchor
            ? new Date(scenarioSpec.dateAnchor)
            : new Date(constants_1.DETERMINISTIC_ANCHOR);
        const endDate = new Date(anchorDate);
        endDate.setHours(0, 0, 0, 0);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (days - 1));
        const execStep = builder.startStep('EXECUTE');
        if (mode === 'FIXTURE') {
            if (goldenFixture) {
                this.logger.info(`[Fixture Mode] Loaded Golden Fixture: ${goldenFixture.scenarioId} (Seed: ${goldenFixture.seed})`);
                this.logger.info(`[Fixture Mode] Checksum: ${goldenFixture.checksum}`);
                this.logger.info(`[Fixture Mode] Generated At: ${goldenFixture.generatedAt}`);
                execStep.close({
                    status: 'SUCCESS',
                    summary: 'Fixture loaded and verified (Generation bypassed)',
                    metrics: {
                        recordsAffectedEstimate: 0,
                        recordsAffectedActual: 0,
                        entitiesTouched: [],
                    }
                });
                builder.setResults({
                    writesPlanned: { entities: [], estimatedCounts: { totalRows: 0, platforms: 0 } },
                    writesApplied: { entities: [], actualCounts: { totalRows: 0, platforms: 0 } }
                });
                return { status: 'SUCCESS', exitCode: 0 };
            }
            else {
                return { status: 'BLOCKED', exitCode: 2 };
            }
        }
        for (const platform of sortedPlatforms) {
            this.logger.info(`Processing platform: ${platform}`);
            const platformHash = crypto.createHash('sha256')
                .update(`${baseSeedHash}:${platform}`)
                .digest('hex');
            const platformSeed = parseInt(platformHash.substring(0, 8), 16);
            faker_1.faker.seed(platformSeed);
            if (!dryRun) {
                const dbPlatform = platform_mapper_1.PlatformMapper.toPersistence(platform);
                const deleted = await this.prisma.metric.deleteMany({
                    where: {
                        tenantId: tenant,
                        isMockData: true,
                        source: sourceTag,
                        platform: dbPlatform
                    }
                });
                await this.prisma.campaign.deleteMany({
                    where: {
                        tenantId: tenant,
                        platform: dbPlatform,
                        externalId: {
                            startsWith: `unified-${scenarioSpec.scenarioId}-${seed}-${platform}`
                        }
                    }
                });
                if (deleted.count > 0) {
                    this.logger.info(`[Idempotency] Cleared ${deleted.count} existing mock rows for ${platform}`);
                }
            }
            const campaignName = `${scenarioSpec.name} - ${platform}`;
            const metrics = this.engine.generateDateRangeMetrics(startDate, endDate, scenarioSpec.trend, scenarioSpec.baseImpressions || 10000, platform);
            totalPlannedRows += metrics.length;
            perPlatformShape[platform] = {
                campaigns: 1,
                metricRows: metrics.length,
            };
            if (!dryRun) {
                await this.prisma.$transaction(async (tx) => {
                    const dbPlatform = platform_mapper_1.PlatformMapper.toPersistence(platform);
                    const externalId = `unified-${scenarioSpec.scenarioId}-${seed}-${platform}-0`;
                    const campaign = await tx.campaign.create({
                        data: {
                            tenantId: tenant,
                            name: campaignName,
                            platform: dbPlatform,
                            status: 'ACTIVE',
                            externalId
                        }
                    });
                    await tx.metric.createMany({
                        data: metrics.map(m => ({
                            tenantId: tenant,
                            campaignId: campaign.id,
                            platform: dbPlatform,
                            date: m.date,
                            impressions: m.metrics.impressions,
                            clicks: m.metrics.clicks,
                            spend: m.metrics.cost,
                            conversions: m.metrics.conversions,
                            revenue: m.metrics.revenue,
                            ctr: m.metrics.ctr,
                            costPerClick: m.metrics.cpc,
                            conversionRate: m.metrics.cvr,
                            roas: m.metrics.roas,
                            isMockData: true,
                            source: sourceTag
                        }))
                    });
                });
                totalAppliedRows += metrics.length;
            }
            processedPlatforms.push(platform);
        }
        const generatedShape = {
            totalCampaigns: processedPlatforms.length,
            totalMetricRows: totalPlannedRows,
            perPlatform: perPlatformShape,
        };
        if (mode === 'HYBRID' && goldenFixture) {
            if (!this.shapesEqual(generatedShape, goldenFixture.shape)) {
                const msg = 'Hybrid verification failed: generated shape does not match fixture shape.';
                execStep.close({ status: 'FAILED', summary: msg });
                return { status: 'BLOCKED', exitCode: 2 };
            }
            const computedChecksum = this.computeShapeChecksum(generatedShape);
            if (computedChecksum !== goldenFixture.checksum) {
                const msg = `Hybrid verification failed: checksum mismatch. ` +
                    `Expected ${goldenFixture.checksum}, got ${computedChecksum}.`;
                execStep.close({ status: 'FAILED', summary: msg });
                return { status: 'BLOCKED', exitCode: 2 };
            }
            this.logger.info(`[Hybrid] Verified shape and checksum: ${computedChecksum}`);
        }
        execStep.close({
            status: 'SUCCESS',
            summary: dryRun
                ? `Planned seed for ${processedPlatforms.length} platform(s): ${processedPlatforms.join(', ')}`
                : `Seeded ${processedPlatforms.length} platform(s): ${processedPlatforms.join(', ')}`,
            metrics: {
                recordsAffectedEstimate: totalPlannedRows,
                recordsAffectedActual: dryRun ? 0 : totalAppliedRows,
                entitiesTouched: ['Campaign', 'Metric'],
            },
        });
        const verifyStep = builder.startStep('VERIFY');
        verifyStep.close({
            status: 'SUCCESS',
            summary: dryRun
                ? `Dry-run planned rows: ${totalPlannedRows}. No database writes applied. Source: ${sourceTag}`
                : `Total rows created: ${totalAppliedRows}. Source: ${sourceTag}`,
        });
        builder.setTenant({
            tenantId: tenant,
            tenantSlug: null,
            tenantDisplayName: null,
            tenantResolution: 'EXPLICIT',
        });
        builder.setResults({
            writesPlanned: {
                entities: ['Campaign', 'Metric'],
                estimatedCounts: {
                    totalRows: totalPlannedRows,
                    platforms: processedPlatforms.length,
                },
            },
            writesApplied: {
                entities: ['Campaign', 'Metric'],
                actualCounts: {
                    totalRows: dryRun ? 0 : totalAppliedRows,
                    platforms: dryRun ? 0 : processedPlatforms.length,
                },
            },
        });
        return { status: 'SUCCESS', exitCode: 0 };
    }
    async enforceHygiene(tenantId, allowRealOverride) {
        const hasRealMetrics = await this.prisma.metric.findFirst({
            where: { tenantId, isMockData: false }
        });
        const hasRealCampaigns = await this.prisma.campaign.findFirst({
            where: {
                tenantId,
                OR: [
                    { externalId: null },
                    { NOT: { externalId: { startsWith: 'unified-' } } },
                ],
            }
        });
        if (hasRealMetrics || hasRealCampaigns) {
            if (allowRealOverride === true) {
                this.logger.warn(`[Hygiene] Override active. Writing mock data to REAL tenant ${tenantId}.`);
                return;
            }
            throw new HygieneError(`Tenant ${tenantId} contains REAL data. Cannot seed without --allow-real-tenant.`);
        }
    }
    async ensureSchemaParity() {
        await (0, write_schema_preflight_1.assertToolkitWriteSchemaParity)(this.prisma);
    }
    resolveTargetPlatforms(platforms) {
        if (!platforms || platforms.trim() === '') {
            return platform_capabilities_1.SEEDABLE_PLATFORMS;
        }
        const normalizedTokens = platforms
            .split(',')
            .map((token) => token.trim())
            .filter((token) => token.length > 0);
        const resolved = [];
        const invalidTokens = [];
        const nonSeedablePlatforms = [];
        for (const token of normalizedTokens) {
            const parsed = (0, platform_utils_1.normalizePlatformInput)(token);
            if (parsed.kind === 'failure') {
                invalidTokens.push(token);
                continue;
            }
            const platform = parsed.value;
            if (!platform_capabilities_1.SEEDABLE_PLATFORMS.includes(platform)) {
                nonSeedablePlatforms.push(platform);
                continue;
            }
            resolved.push(platform);
        }
        if (invalidTokens.length > 0 || nonSeedablePlatforms.length > 0 || resolved.length === 0) {
            const allowed = platform_capabilities_1.SEEDABLE_PLATFORMS.join(', ');
            const invalidPart = invalidTokens.length > 0
                ? `invalid tokens: ${invalidTokens.join(', ')}`
                : '';
            const nonSeedablePart = nonSeedablePlatforms.length > 0
                ? `non-seedable: ${Array.from(new Set(nonSeedablePlatforms)).join(', ')}`
                : '';
            const details = [invalidPart, nonSeedablePart].filter(Boolean).join('; ');
            throw new HygieneError(`Invalid platforms input (${details}). Allowed seedable platforms: ${allowed}`);
        }
        return Array.from(new Set(resolved));
    }
    shapesEqual(left, right) {
        return JSON.stringify(this.deepSortKeys(left)) === JSON.stringify(this.deepSortKeys(right));
    }
    computeShapeChecksum(shape) {
        const canonical = JSON.stringify(this.deepSortKeys(shape));
        const hash = crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
        return `sha256:${hash}`;
    }
    deepSortKeys(input) {
        if (input === null || typeof input !== 'object') {
            return input;
        }
        if (Array.isArray(input)) {
            return input.map((item) => this.deepSortKeys(item));
        }
        const sorted = {};
        for (const key of Object.keys(input).sort()) {
            sorted[key] = this.deepSortKeys(input[key]);
        }
        return sorted;
    }
};
exports.SeedUnifiedCommandHandler = SeedUnifiedCommandHandler;
exports.SeedUnifiedCommandHandler = SeedUnifiedCommandHandler = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __param(1, (0, tsyringe_1.inject)(container_1.TOKENS.PrismaClient)),
    __param(2, (0, tsyringe_1.inject)(scenario_loader_1.ScenarioLoader)),
    __param(3, (0, tsyringe_1.inject)(fixture_provider_1.FixtureProvider)),
    __metadata("design:paramtypes", [Object, client_1.PrismaClient,
        scenario_loader_1.ScenarioLoader,
        fixture_provider_1.FixtureProvider])
], SeedUnifiedCommandHandler);
//# sourceMappingURL=seed-unified.command.js.map