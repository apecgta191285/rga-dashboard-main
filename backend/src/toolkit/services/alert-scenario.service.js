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
exports.AlertScenarioService = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const platform_types_1 = require("../domain/platform.types");
const google_ads_seeder_service_1 = require("./google-ads-seeder.service");
const alert_engine_service_1 = require("./alert-engine.service");
const google_ads_seeder_service_2 = require("./google-ads-seeder.service");
const container_1 = require("../core/container");
const math_safety_util_1 = require("../../utils/math-safety.util");
let AlertScenarioService = class AlertScenarioService {
    constructor(seederService, alertEngine, prisma) {
        this.seederService = seederService;
        this.alertEngine = alertEngine;
        this.prisma = prisma;
    }
    async execute(config, progressReporter = new google_ads_seeder_service_2.NoOpProgressReporter()) {
        try {
            const seedConfig = {
                days: config.days,
                platform: platform_types_1.ToolkitPlatform.GoogleAds,
                seedSource: 'alert_scenario_baseline',
            };
            const seedResult = await this.seederService.seed(config.tenantId, seedConfig, progressReporter);
            if (!seedResult.success) {
                return {
                    success: false,
                    status: 'error',
                    message: `Step 1 failed: ${seedResult.message}`,
                    error: seedResult.error,
                };
            }
            if (seedResult.status === 'no_campaigns') {
                if (!config.autoCreateCampaigns) {
                    return {
                        success: true,
                        status: 'no_campaigns',
                        message: 'No campaigns found. Enable autoCreateCampaigns to create dummy campaigns.',
                    };
                }
                return {
                    success: true,
                    status: 'no_campaigns',
                    message: 'No campaigns found (auto-create not implemented in MVP).',
                };
            }
            const dateRange = {
                start: new Date(seedResult.data?.dateRange.start || ''),
                end: new Date(seedResult.data?.dateRange.end || ''),
            };
            let anomalyInjected = false;
            if (config.injectAnomaly && seedResult.data) {
                anomalyInjected = await this.injectAnomaly(config.tenantId, dateRange.start, dateRange.end, seedConfig.seedSource);
            }
            const evaluationContext = {
                tenantId: config.tenantId,
                dateRange,
                dryRun: false,
            };
            const snapshots = await this.loadLatestSnapshots(config.tenantId, dateRange.start, dateRange.end, seedConfig.seedSource);
            const baselines = await this.loadBaselines(config.tenantId, dateRange.start, dateRange.end, seedConfig.seedSource);
            const rules = await this.loadAlertRules(config.tenantId);
            const activeRules = rules.length > 0
                ? rules
                : [
                    this.createSampleRule('zero_conversions'),
                    this.createSampleRule('high_spend'),
                ];
            const evaluationResult = this.alertEngine.evaluateCheck(snapshots, activeRules, evaluationContext, baselines);
            const alertCheck = {
                success: true,
                triggeredAlerts: evaluationResult.triggeredAlerts,
                evaluatedAt: evaluationResult.evaluatedAt,
                metadata: {
                    snapshotsEvaluated: snapshots.length,
                    totalRulesEvaluated: evaluationResult.metadata.enabledRules,
                    totalRulesTriggered: evaluationResult.metadata.triggeredCount,
                    durationMs: evaluationResult.metadata.durationMs,
                },
            };
            return {
                success: true,
                status: 'completed',
                message: 'Alert scenario completed successfully',
                data: {
                    tenantId: config.tenantId,
                    seedResult: {
                        seededCount: seedResult.data?.seededCount ?? 0,
                        campaignCount: seedResult.data?.campaignCount ?? 0,
                        dateRange: seedResult.data?.dateRange ?? { start: '', end: '' },
                    },
                    anomalyInjected,
                    alertCheck,
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                status: 'error',
                message: 'Alert scenario failed',
                error: errorMessage,
            };
        }
    }
    async assertSchemaParity() {
        await this.seederService.assertSchemaParity();
    }
    async injectAnomaly(tenantId, start, end, source) {
        const latestMetric = await this.prisma.metric.findFirst({
            where: {
                tenantId,
                isMockData: true,
                source,
                date: { gte: start, lte: end },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        });
        if (!latestMetric) {
            return false;
        }
        const spend = Number(latestMetric.spend);
        const bumpedSpend = Math.max(spend * 1.6, spend + 100);
        const clicks = latestMetric.clicks;
        const impressions = latestMetric.impressions;
        const conversions = 0;
        const revenue = 0;
        await this.prisma.metric.update({
            where: { id: latestMetric.id },
            data: {
                spend: bumpedSpend,
                conversions,
                revenue,
                orders: 0,
                ctr: (0, math_safety_util_1.safeCtr)(clicks, impressions),
                costPerClick: (0, math_safety_util_1.safeCpc)(bumpedSpend, clicks),
                conversionRate: (0, math_safety_util_1.safeConversionRate)(conversions, clicks),
                roas: (0, math_safety_util_1.safeRoas)(revenue, bumpedSpend),
                source: `${source}:anomaly`,
            },
        });
        return true;
    }
    async loadLatestSnapshots(tenantId, start, end, source) {
        const rows = await this.prisma.metric.findMany({
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: source },
                date: { gte: start, lte: end },
            },
            orderBy: [{ campaignId: 'asc' }, { date: 'desc' }, { createdAt: 'desc' }],
            take: 5000,
        });
        const latestByCampaign = new Map();
        for (const row of rows) {
            if (!latestByCampaign.has(row.campaignId)) {
                latestByCampaign.set(row.campaignId, row);
            }
        }
        return Array.from(latestByCampaign.values()).map((row) => ({
            tenantId: row.tenantId,
            campaignId: row.campaignId,
            date: row.date,
            platform: row.platform,
            metrics: {
                impressions: row.impressions,
                clicks: row.clicks,
                conversions: row.conversions,
                spend: Number(row.spend),
                revenue: Number(row.revenue),
                ctr: Number(row.ctr),
                cpc: Number(row.costPerClick),
                cvr: Number(row.conversionRate),
                roas: Number(row.roas),
            },
        }));
    }
    async loadBaselines(tenantId, start, end, source) {
        const rows = await this.prisma.metric.findMany({
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: source },
                date: { gte: start, lte: end },
            },
            orderBy: [{ campaignId: 'asc' }, { date: 'asc' }, { createdAt: 'asc' }],
            take: 5000,
        });
        const earliestByCampaign = new Map();
        for (const row of rows) {
            if (!earliestByCampaign.has(row.campaignId)) {
                earliestByCampaign.set(row.campaignId, row);
            }
        }
        const baselines = new Map();
        for (const [campaignId, row] of earliestByCampaign.entries()) {
            baselines.set(campaignId, {
                metrics: {
                    impressions: row.impressions,
                    clicks: row.clicks,
                    conversions: row.conversions,
                    spend: Number(row.spend),
                    revenue: Number(row.revenue),
                    ctr: Number(row.ctr),
                    cpc: Number(row.costPerClick),
                    cvr: Number(row.conversionRate),
                    roas: Number(row.roas),
                },
                dateRange: { start, end },
            });
        }
        return baselines;
    }
    async loadAlertRules(tenantId) {
        const rows = await this.prisma.alertRule.findMany({
            where: {
                tenantId,
                isActive: true,
            },
            orderBy: [{ createdAt: 'asc' }],
            take: 1000,
        });
        const output = [];
        for (const row of rows) {
            const metric = this.mapMetricKey(row.metric);
            if (!metric) {
                continue;
            }
            const condition = row.alertType === 'ANOMALY'
                ? {
                    type: 'DROP_PERCENT',
                    metric,
                    thresholdPercent: Number(row.threshold),
                }
                : {
                    type: 'THRESHOLD',
                    metric,
                    operator: this.mapOperator(row.operator),
                    value: Number(row.threshold),
                };
            output.push({
                id: row.id,
                name: row.name,
                enabled: row.isActive,
                condition,
                severity: this.mapSeverity(row.severity),
            });
        }
        return output;
    }
    mapMetricKey(metric) {
        const normalized = metric.trim().toLowerCase();
        const directMap = {
            impressions: 'impressions',
            clicks: 'clicks',
            conversions: 'conversions',
            spend: 'spend',
            revenue: 'revenue',
            ctr: 'ctr',
            cpc: 'cpc',
            cost_per_click: 'cpc',
            conversion_rate: 'cvr',
            cvr: 'cvr',
            roas: 'roas',
        };
        return directMap[normalized] ?? null;
    }
    mapOperator(operator) {
        const normalized = operator.trim().toUpperCase();
        const mapping = {
            '>': 'GT',
            'GT': 'GT',
            '>=': 'GTE',
            'GTE': 'GTE',
            '<': 'LT',
            'LT': 'LT',
            '<=': 'LTE',
            'LTE': 'LTE',
            '=': 'EQ',
            '==': 'EQ',
            'EQ': 'EQ',
        };
        return mapping[normalized] ?? 'GT';
    }
    mapSeverity(severity) {
        const normalized = severity.trim().toUpperCase();
        if (normalized === 'INFO')
            return 'LOW';
        if (normalized === 'WARNING')
            return 'MEDIUM';
        if (normalized === 'CRITICAL')
            return 'CRITICAL';
        return 'HIGH';
    }
    createSampleRule(type) {
        const baseRule = {
            id: `sample-${type}`,
            name: `Sample ${type.replace('_', ' ')}`,
            enabled: true,
        };
        switch (type) {
            case 'high_spend':
                return {
                    ...baseRule,
                    severity: 'HIGH',
                    condition: {
                        type: 'THRESHOLD',
                        metric: 'spend',
                        operator: 'GT',
                        value: 10000,
                    },
                };
            case 'zero_conversions':
                return {
                    ...baseRule,
                    severity: 'CRITICAL',
                    condition: {
                        type: 'ZERO_CONVERSIONS',
                        minSpend: 5000,
                    },
                };
            case 'low_roas':
                return {
                    ...baseRule,
                    severity: 'MEDIUM',
                    condition: {
                        type: 'THRESHOLD',
                        metric: 'roas',
                        operator: 'LT',
                        value: 1.0,
                    },
                };
            default:
                throw new Error(`Unknown rule type: ${type}`);
        }
    }
};
exports.AlertScenarioService = AlertScenarioService;
exports.AlertScenarioService = AlertScenarioService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(google_ads_seeder_service_1.GoogleAdsSeederService)),
    __param(1, (0, tsyringe_1.inject)(alert_engine_service_1.AlertEngine)),
    __param(2, (0, tsyringe_1.inject)(container_1.TOKENS.PrismaClient)),
    __metadata("design:paramtypes", [google_ads_seeder_service_1.GoogleAdsSeederService,
        alert_engine_service_1.AlertEngine,
        client_1.PrismaClient])
], AlertScenarioService);
//# sourceMappingURL=alert-scenario.service.js.map