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
exports.MockMetricProvider = void 0;
class SeededRandom {
    constructor(seed) {
        this.seed = seed.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
        }, 0);
    }
    next() {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return (this.seed >>> 0) / 4294967296;
    }
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }
}
class MockMetricProvider {
    constructor(context) {
        this.context = context;
        const seed = context.seed ?? this.hashContext(context);
        this.rng = new SeededRandom(seed);
    }
    async fetchSnapshots(tenantId, dateRange) {
        if (tenantId !== this.context.tenantId) {
            throw new Error(`Tenant mismatch: provider configured for ${this.context.tenantId}, ` +
                `but fetchSnapshots called with ${tenantId}`);
        }
        let snapshots = [];
        if (this.context.mode === 'FIXTURE' || this.context.mode === 'HYBRID') {
            const fixtureSnapshots = await this.loadMetricFixtures();
            if (fixtureSnapshots.length > 0) {
                snapshots = fixtureSnapshots;
            }
        }
        if (snapshots.length === 0 &&
            (this.context.mode === 'GENERATED' || this.context.mode === 'HYBRID')) {
            snapshots = this.generateDeterministicSnapshots();
        }
        if (this.context.metricOverrides) {
            snapshots = this.applyOverrides(snapshots);
        }
        snapshots = snapshots.map((s) => ({
            ...s,
            date: this.context.dateRange.end,
        }));
        return snapshots;
    }
    async fetchBaselines(tenantId, campaignIds, baselineDateRange) {
        if (tenantId !== this.context.tenantId) {
            throw new Error(`Tenant mismatch: provider configured for ${this.context.tenantId}, ` +
                `but fetchBaselines called with ${tenantId}`);
        }
        const baselines = new Map();
        const baselineFixtures = await this.loadBaselineFixtures();
        for (const campaignId of campaignIds) {
            const fixture = baselineFixtures.get(campaignId);
            if (fixture) {
                baselines.set(campaignId, fixture);
                continue;
            }
            const generated = this.generateDeterministicBaseline(campaignId);
            baselines.set(campaignId, generated);
        }
        return baselines;
    }
    async loadMetricFixtures() {
        const basePath = this.context.fixtureBasePath ?? './fixtures';
        const path = `${basePath}/metrics/${this.context.scenarioName}.json`;
        try {
            const module = await Promise.resolve(`${path}`).then(s => __importStar(require(s)));
            const data = module.default ?? module;
            if (Array.isArray(data)) {
                return data.map((s) => this.validateAndNormalizeSnapshot(s));
            }
            return [];
        }
        catch {
            return [];
        }
    }
    async loadBaselineFixtures() {
        const basePath = this.context.fixtureBasePath ?? './fixtures';
        const path = `${basePath}/metrics/${this.context.scenarioName}-baseline.json`;
        const baselines = new Map();
        try {
            const module = await Promise.resolve(`${path}`).then(s => __importStar(require(s)));
            const data = module.default ?? module;
            if (typeof data === 'object' && data !== null) {
                for (const [campaignId, snapshot] of Object.entries(data)) {
                    const baseline = this.validateAndNormalizeBaseline(snapshot);
                    if (baseline) {
                        baselines.set(campaignId, baseline);
                    }
                }
            }
        }
        catch {
        }
        return baselines;
    }
    generateDeterministicSnapshots() {
        const campaignCount = this.rng.nextInt(1, 3);
        const snapshots = [];
        for (let i = 0; i < campaignCount; i++) {
            snapshots.push(this.generateCampaignSnapshot(i));
        }
        return snapshots;
    }
    generateCampaignSnapshot(index) {
        const campaignId = `campaign-${index}`;
        switch (this.context.scenarioName) {
            case 'zero-conversion':
                return this.generateZeroConversionSnapshot(campaignId);
            case 'drop-spend':
                return this.generateDropSpendSnapshot(campaignId);
            case 'high-roas':
                return this.generateHighRoasSnapshot(campaignId);
            case 'missing-metrics':
                return this.generatePartialSnapshot(campaignId);
            default:
                return this.generateDefaultSnapshot(campaignId);
        }
    }
    generateZeroConversionSnapshot(campaignId) {
        const impressions = this.rng.nextInt(5000, 50000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.01, 0.05));
        const spend = this.rng.nextFloat(1000, 10000);
        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions,
                clicks,
                conversions: 0,
                spend,
                revenue: 0,
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: 0,
                roas: 0,
            },
        };
    }
    generateDropSpendSnapshot(campaignId) {
        const impressions = this.rng.nextInt(3000, 15000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.02, 0.04));
        const spend = this.rng.nextFloat(500, 3000);
        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions,
                clicks,
                conversions: this.rng.nextInt(1, 20),
                spend,
                revenue: spend * this.rng.nextFloat(0.8, 3.0),
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: clicks > 0 ? 0.05 : 0,
                roas: 1.5,
            },
        };
    }
    generateHighRoasSnapshot(campaignId) {
        const impressions = this.rng.nextInt(10000, 100000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.03, 0.08));
        const conversions = Math.floor(clicks * this.rng.nextFloat(0.02, 0.08));
        const spend = this.rng.nextFloat(5000, 20000);
        const revenue = spend * this.rng.nextFloat(5.0, 10.0);
        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions,
                clicks,
                conversions,
                spend,
                revenue,
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: conversions / clicks,
                roas: revenue / spend,
            },
        };
    }
    generatePartialSnapshot(campaignId) {
        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions: this.rng.nextInt(1000, 10000),
                clicks: this.rng.nextInt(10, 500),
                conversions: this.rng.nextInt(0, 5),
                spend: this.rng.nextFloat(100, 2000),
                revenue: 0,
                ctr: 0,
                cpc: 0,
                cvr: 0,
                roas: 0,
            },
        };
    }
    generateDefaultSnapshot(campaignId) {
        const impressions = this.rng.nextInt(5000, 50000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.02, 0.05));
        const conversions = Math.floor(clicks * this.rng.nextFloat(0.01, 0.05));
        const spend = this.rng.nextFloat(1000, 15000);
        const revenue = spend * this.rng.nextFloat(0.5, 4.0);
        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions,
                clicks,
                conversions,
                spend,
                revenue,
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: conversions / clicks,
                roas: revenue / spend,
            },
        };
    }
    generateDeterministicBaseline(campaignId) {
        const impressions = this.rng.nextInt(10000, 50000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.04, 0.08));
        const spend = this.rng.nextFloat(5000, 20000);
        const duration = this.context.dateRange.end.getTime() - this.context.dateRange.start.getTime();
        const baselineEnd = new Date(this.context.dateRange.start.getTime() - 1);
        const baselineStart = new Date(baselineEnd.getTime() - duration);
        return {
            metrics: {
                impressions,
                clicks,
                conversions: Math.floor(clicks * 0.05),
                spend,
                revenue: spend * 2,
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: 0.05,
                roas: 2,
            },
            dateRange: {
                start: baselineStart,
                end: baselineEnd,
            },
        };
    }
    applyOverrides(snapshots) {
        const overrides = this.context.metricOverrides ?? {};
        return snapshots.map((snapshot) => ({
            ...snapshot,
            metrics: {
                ...snapshot.metrics,
                ...overrides,
            },
        }));
    }
    validateAndNormalizeSnapshot(data) {
        const s = data;
        return {
            tenantId: String(s.tenantId ?? this.context.tenantId),
            campaignId: String(s.campaignId ?? 'unknown'),
            date: new Date(String(s.date)),
            platform: String(s.platform ?? 'GOOGLE_ADS'),
            metrics: this.validateMetrics(s.metrics),
        };
    }
    validateAndNormalizeBaseline(data) {
        if (!data.metrics || !data.dateRange)
            return null;
        return {
            metrics: this.validateMetrics(data.metrics),
            dateRange: {
                start: new Date(String(data.dateRange.start)),
                end: new Date(String(data.dateRange.end)),
            },
        };
    }
    validateMetrics(m) {
        return {
            impressions: m.impressions ?? 0,
            clicks: m.clicks ?? 0,
            conversions: m.conversions ?? 0,
            spend: m.spend ?? 0,
            revenue: m.revenue ?? 0,
            ctr: m.ctr ?? 0,
            cpc: m.cpc ?? 0,
            cvr: m.cvr ?? 0,
            roas: m.roas ?? 0,
        };
    }
    hashContext(context) {
        return `${context.scenarioName}:${context.tenantId}:${context.dateRange.start.toISOString()}`;
    }
}
exports.MockMetricProvider = MockMetricProvider;
//# sourceMappingURL=mock-metric.provider.js.map