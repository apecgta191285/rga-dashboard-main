"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
let mockPrisma;
const dashboard_service_1 = require("../../modules/dashboard/dashboard.service");
const alert_service_1 = require("../../modules/alerts/alert.service");
const createDashboardService = () => {
    return new dashboard_service_1.DashboardService(mockPrisma);
};
const createAlertService = () => {
    const mockNotify = { triggerFromAlert: node_test_1.mock.fn() };
    return new alert_service_1.AlertService(mockPrisma, mockNotify);
};
(0, node_test_1.describe)('Phase 1B: Data Provenance Contract', () => {
    (0, node_test_1.beforeEach)(() => {
        mockPrisma = {
            metric: {
                aggregate: node_test_1.mock.fn(() => Promise.resolve({ _sum: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 } })),
                groupBy: node_test_1.mock.fn(() => Promise.resolve([])),
                createMany: node_test_1.mock.fn(),
                updateMany: node_test_1.mock.fn(),
                findFirst: node_test_1.mock.fn(),
            },
            campaign: {
                findMany: node_test_1.mock.fn(() => Promise.resolve([])),
                findFirst: node_test_1.mock.fn(),
                create: node_test_1.mock.fn(),
            },
            tenant: { findUnique: node_test_1.mock.fn() },
            googleAdsAccount: { count: node_test_1.mock.fn() },
            googleAnalyticsAccount: { count: node_test_1.mock.fn() },
            user: { count: node_test_1.mock.fn() },
            webAnalyticsDaily: { aggregate: node_test_1.mock.fn() },
            alertRule: { findMany: node_test_1.mock.fn(() => Promise.resolve([])) },
        };
    });
    (0, node_test_1.describe)('DashboardService (Readers)', () => {
        (0, node_test_1.it)('getSummary should apply REAL_DATA_FILTER by default', async () => {
            const service = createDashboardService();
            mockPrisma.metric.aggregate = node_test_1.mock.fn(() => Promise.resolve({ _sum: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 } }));
            await service.getOverview({ tenantId: 't1', role: 'admin' }, {});
            const call = mockPrisma.metric.aggregate.mock.calls[0];
            node_assert_1.default.ok(call, 'metric.aggregate should be called');
            const where = call.arguments[0].where;
            node_assert_1.default.strictEqual(where.isMockData, false, 'Must filter isMockData: false');
        });
        (0, node_test_1.it)('getTopCampaigns should apply REAL_DATA_FILTER', async () => {
            const service = createDashboardService();
            mockPrisma.metric.groupBy = node_test_1.mock.fn(() => Promise.resolve([]));
            await service.getTopCampaigns('t1');
            const call = mockPrisma.metric.groupBy.mock.calls[0];
            node_assert_1.default.ok(call, 'metric.groupBy called');
            node_assert_1.default.strictEqual(call.arguments[0].where.isMockData, false);
        });
    });
    (0, node_test_1.describe)('AlertService (Readers)', () => {
        (0, node_test_1.it)('checkAlerts should apply REAL_DATA_FILTER to metrics include', async () => {
            const service = createAlertService();
            mockPrisma.alertRule.findMany = node_test_1.mock.fn(() => Promise.resolve([
                { id: 'r1', name: 'Rule 1', metric: 'spend', operator: 'gt', threshold: 100, isActive: true }
            ]));
            await service.checkAlerts('t1');
            const call = mockPrisma.campaign.findMany.mock.calls[0];
            node_assert_1.default.ok(call, 'campaign.findMany called');
            const include = call.arguments[0].include.metrics;
            node_assert_1.default.strictEqual(include.where.isMockData, false, 'Must filter metrics by isMockData: false');
        });
    });
});
//# sourceMappingURL=provenance-contract.test.js.map