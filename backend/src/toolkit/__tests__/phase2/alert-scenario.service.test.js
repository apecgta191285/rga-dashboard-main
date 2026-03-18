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
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const alert_scenario_service_1 = require("../../services/alert-scenario.service");
(0, node_test_1.describe)('AlertScenarioService (real data orchestration)', () => {
    (0, node_test_1.test)('loads snapshots/rules from Prisma and injects anomaly before evaluation', async () => {
        const seederService = {
            seed: async () => ({
                success: true,
                status: 'completed',
                message: 'ok',
                data: {
                    tenantId: 'tenant-1',
                    tenantName: 'tenant-1',
                    seededCount: 4,
                    campaignCount: 2,
                    dateRange: {
                        start: '2025-01-01',
                        end: '2025-01-31',
                    },
                    campaigns: [],
                },
            }),
        };
        let metricFindManyCall = 0;
        const prisma = {
            metric: {
                findFirst: async () => ({
                    id: 'm-latest',
                    spend: 100,
                    clicks: 20,
                    impressions: 1000,
                    conversions: 2,
                    revenue: 300,
                }),
                update: async () => ({ id: 'm-latest' }),
                findMany: async () => {
                    metricFindManyCall += 1;
                    if (metricFindManyCall === 1) {
                        return [
                            {
                                tenantId: 'tenant-1',
                                campaignId: 'c-1',
                                date: new Date('2025-01-31'),
                                createdAt: new Date('2025-01-31T12:00:00Z'),
                                platform: 'GOOGLE_ADS',
                                impressions: 1000,
                                clicks: 100,
                                conversions: 5,
                                spend: 250,
                                revenue: 600,
                                ctr: 0.1,
                                costPerClick: 2.5,
                                conversionRate: 0.05,
                                roas: 2.4,
                            },
                            {
                                tenantId: 'tenant-1',
                                campaignId: 'c-2',
                                date: new Date('2025-01-31'),
                                createdAt: new Date('2025-01-31T12:00:00Z'),
                                platform: 'GOOGLE_ADS',
                                impressions: 800,
                                clicks: 70,
                                conversions: 3,
                                spend: 180,
                                revenue: 390,
                                ctr: 0.0875,
                                costPerClick: 2.57,
                                conversionRate: 0.0428,
                                roas: 2.16,
                            },
                        ];
                    }
                    return [
                        {
                            tenantId: 'tenant-1',
                            campaignId: 'c-1',
                            date: new Date('2025-01-01'),
                            createdAt: new Date('2025-01-01T12:00:00Z'),
                            platform: 'GOOGLE_ADS',
                            impressions: 900,
                            clicks: 80,
                            conversions: 4,
                            spend: 200,
                            revenue: 500,
                            ctr: 0.0888,
                            costPerClick: 2.5,
                            conversionRate: 0.05,
                            roas: 2.5,
                        },
                        {
                            tenantId: 'tenant-1',
                            campaignId: 'c-2',
                            date: new Date('2025-01-01'),
                            createdAt: new Date('2025-01-01T12:00:00Z'),
                            platform: 'GOOGLE_ADS',
                            impressions: 700,
                            clicks: 60,
                            conversions: 2,
                            spend: 140,
                            revenue: 260,
                            ctr: 0.0857,
                            costPerClick: 2.33,
                            conversionRate: 0.0333,
                            roas: 1.85,
                        },
                    ];
                },
            },
            alertRule: {
                findMany: async () => ([
                    {
                        id: 'rule-1',
                        name: 'Spend limit',
                        alertType: 'THRESHOLD',
                        metric: 'spend',
                        operator: '>',
                        threshold: 200,
                        severity: 'WARNING',
                        isActive: true,
                        createdAt: new Date('2025-01-01T00:00:00Z'),
                    },
                ]),
            },
        };
        const alertEngine = {
            evaluateCheck: (snapshots, rules, _context, baselines) => {
                assert.strictEqual(snapshots.length, 2);
                assert.strictEqual(rules.length, 1);
                assert.strictEqual(rules[0].id, 'rule-1');
                assert.strictEqual(baselines.size, 2);
                return {
                    triggeredAlerts: [],
                    evaluatedAt: new Date('2025-01-31T12:00:00Z'),
                    metadata: {
                        totalRules: 1,
                        enabledRules: 1,
                        triggeredCount: 0,
                        durationMs: 5,
                    },
                };
            },
        };
        const service = new alert_scenario_service_1.AlertScenarioService(seederService, alertEngine, prisma);
        const result = await service.execute({
            tenantId: 'tenant-1',
            days: 30,
            injectAnomaly: true,
            autoCreateCampaigns: false,
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.status, 'completed');
        assert.strictEqual(result.data?.anomalyInjected, true);
        assert.strictEqual(result.data?.alertCheck.metadata.snapshotsEvaluated, 2);
        assert.strictEqual(result.data?.alertCheck.metadata.totalRulesEvaluated, 1);
    });
});
//# sourceMappingURL=alert-scenario.service.test.js.map