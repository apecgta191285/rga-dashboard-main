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
const dashboard_service_1 = require("../../../modules/dashboard/dashboard.service");
const provenance_constants_1 = require("../../../common/provenance.constants");
const common_1 = require("@nestjs/common");
(0, node_test_1.describe)('DashboardService (T1: PROD Invariant)', () => {
    let dashboardService;
    let mockPrisma;
    (0, node_test_1.beforeEach)(() => {
        mockPrisma = {
            campaign: {
                count: async () => 0,
                findMany: async () => [],
            },
            metric: {
                aggregate: async () => ({ _sum: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 } }),
                findFirst: async () => null,
                groupBy: async () => [],
            },
            googleAdsAccount: { count: async () => 0 },
            googleAnalyticsAccount: { count: async () => 0 },
            tenant: { findUnique: async () => null },
            user: { count: async () => 0 },
            webAnalyticsDaily: { aggregate: async () => ({ _sum: {} }) }
        };
        dashboardService = new dashboard_service_1.DashboardService(mockPrisma);
    });
    (0, node_test_1.test)('getSummary should filter isMockData: false for campaign counts (Active & Total)', async () => {
        const calls = [];
        mockPrisma.campaign.count = async (args) => {
            calls.push(args);
            return 0;
        };
        await dashboardService.getSummary('tenant-1');
        assert.strictEqual(calls.length, 3, 'Should call count 3 times (total, active, previous)');
        calls.forEach((arg, index) => {
            assert.strictEqual(arg.where.isMockData, false, `Call ${index} should filter isMockData: false`);
            assert.strictEqual(arg.where.tenantId, 'tenant-1', `Call ${index} should filter by tenant`);
        });
    });
    (0, node_test_1.test)('getSummary should apply REAL_DATA_FILTER to metrics aggregation', async () => {
        const calls = [];
        mockPrisma.metric.aggregate = async (args) => {
            calls.push(args);
            return { _sum: {} };
        };
        await dashboardService.getSummary('tenant-1');
        assert.strictEqual(calls.length, 2, 'Should aggregate metrics 2 times');
        calls.forEach((arg, index) => {
            assert.strictEqual(arg.where.isMockData, false, `Metric Aggregation ${index} should filter isMockData: false`);
        });
    });
    (0, node_test_1.test)('getSummaryByPlatform should filter mock data', async () => {
        const campaignCalls = [];
        mockPrisma.campaign.count = async (args) => {
            campaignCalls.push(args);
            return 0;
        };
        const metricCalls = [];
        mockPrisma.metric.aggregate = async (args) => {
            metricCalls.push(args);
            return { _sum: {} };
        };
        await dashboardService.getSummaryByPlatform('tenant-1', 30, 'GOOGLE_ADS');
        campaignCalls.forEach(arg => {
            assert.strictEqual(arg.where.isMockData, false, 'Campaign count should filter mock data');
        });
        metricCalls.forEach(arg => {
            assert.strictEqual(arg.where.isMockData, false, 'Metric aggregate should filter mock data');
        });
    });
    (0, node_test_1.test)('getSummaryByPlatform should reject unsupported platform filters', async () => {
        await assert.rejects(() => dashboardService.getSummaryByPlatform('tenant-1', 30, 'UNKNOWN_PLATFORM'), (error) => error instanceof common_1.BadRequestException);
    });
    (0, node_test_1.test)('getTopCampaigns should filter mock data when fetching details', async () => {
        mockPrisma.metric.groupBy = async () => [
            { campaignId: 'c1', _sum: { spend: 100 } }
        ];
        let findArgs = null;
        mockPrisma.campaign.findMany = async (args) => {
            findArgs = args;
            return [{ id: 'c1', name: 'Test', isMockData: false }];
        };
        await dashboardService.getTopCampaigns('tenant-1');
        assert.ok(findArgs, 'Should call findMany campaigns');
        assert.strictEqual(findArgs.where.isMockData, false, 'Should filter campaigns by isMockData: false');
    });
    (0, node_test_1.test)('getSummary should support explicit MOCK provenance mode', async () => {
        const campaignCalls = [];
        mockPrisma.campaign.count = async (args) => {
            campaignCalls.push(args);
            return 0;
        };
        const metricCalls = [];
        mockPrisma.metric.aggregate = async (args) => {
            metricCalls.push(args);
            return { _sum: {} };
        };
        await dashboardService.getSummary('tenant-1', 30, provenance_constants_1.ProvenanceMode.MOCK);
        campaignCalls.forEach(arg => {
            assert.strictEqual(arg.where.isMockData, true, 'MOCK mode must query isMockData=true campaigns');
        });
        metricCalls.forEach(arg => {
            assert.strictEqual(arg.where.isMockData, true, 'MOCK mode must query isMockData=true metrics');
        });
    });
    (0, node_test_1.test)('getSummary should support explicit ALL provenance mode', async () => {
        const campaignCalls = [];
        mockPrisma.campaign.count = async (args) => {
            campaignCalls.push(args);
            return 0;
        };
        const metricCalls = [];
        mockPrisma.metric.aggregate = async (args) => {
            metricCalls.push(args);
            return { _sum: {} };
        };
        await dashboardService.getSummary('tenant-1', 30, provenance_constants_1.ProvenanceMode.ALL);
        campaignCalls.forEach(arg => {
            assert.strictEqual(Object.prototype.hasOwnProperty.call(arg.where, 'isMockData'), false, 'ALL mode must not enforce campaign provenance filter');
        });
        metricCalls.forEach(arg => {
            assert.strictEqual(Object.prototype.hasOwnProperty.call(arg.where, 'isMockData'), false, 'ALL mode must not enforce metric provenance filter');
        });
    });
    (0, node_test_1.test)('getPerformanceByPlatform should include extended ad platforms and GA row', async () => {
        mockPrisma.metric.groupBy = async () => [];
        mockPrisma.campaign.findMany = async () => [];
        mockPrisma.webAnalyticsDaily.aggregate = async () => ({ _sum: {} });
        const rows = await dashboardService.getPerformanceByPlatform('tenant-1', 30, provenance_constants_1.ProvenanceMode.REAL);
        const platforms = rows.map((row) => row.platform);
        assert.ok(platforms.includes('GOOGLE_ADS'));
        assert.ok(platforms.includes('FACEBOOK'));
        assert.ok(platforms.includes('TIKTOK'));
        assert.ok(platforms.includes('LINE_ADS'));
        assert.ok(platforms.includes('SHOPEE'));
        assert.ok(platforms.includes('LAZADA'));
        assert.ok(platforms.includes('INSTAGRAM'));
        assert.ok(platforms.includes('GOOGLE_ANALYTICS'));
    });
    (0, node_test_1.test)('getOverview should expose platformPerformance for full-platform breakdown widgets', async () => {
        mockPrisma.metric.groupBy = async () => [];
        mockPrisma.campaign.findMany = async () => [];
        mockPrisma.webAnalyticsDaily.aggregate = async () => ({ _sum: {} });
        const response = await dashboardService.getOverview({ tenantId: 'tenant-1', role: 'MANAGER' }, { period: '7d', provenance: provenance_constants_1.ProvenanceMode.REAL });
        assert.ok(Array.isArray(response.data.platformPerformance));
        assert.ok(response.data.platformPerformance.length >= 1);
    });
});
//# sourceMappingURL=dashboard-service.test.js.map