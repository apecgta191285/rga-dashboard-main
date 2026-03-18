"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const mock_metric_provider_1 = require("../mock-metric.provider");
const simulation_context_1 = require("../simulation-context");
(0, node_test_1.describe)('MockMetricProvider Determinism', () => {
    const defaultDateRange = {
        start: new Date('2023-01-01T00:00:00Z'),
        end: new Date('2023-01-02T00:00:00Z'),
    };
    const tenantId = 'tenant-1';
    (0, node_test_1.it)('produces identical metrics for same seed', async () => {
        const seed = 'test-seed-123';
        const context1 = (0, simulation_context_1.createSimulationContext)({
            tenantId,
            scenarioName: 'test',
            dateRange: defaultDateRange,
            mode: 'GENERATED',
            seed,
        });
        const context2 = (0, simulation_context_1.createSimulationContext)({
            tenantId,
            scenarioName: 'test',
            dateRange: defaultDateRange,
            mode: 'GENERATED',
            seed,
        });
        const provider1 = new mock_metric_provider_1.MockMetricProvider(context1);
        const provider2 = new mock_metric_provider_1.MockMetricProvider(context2);
        const snapshots1 = await provider1.fetchSnapshots(tenantId, defaultDateRange);
        const snapshots2 = await provider2.fetchSnapshots(tenantId, defaultDateRange);
        node_assert_1.strict.deepStrictEqual(snapshots1, snapshots2);
        const baselines1 = await provider1.fetchBaselines(tenantId, ['camp-1'], defaultDateRange);
        const baselines2 = await provider2.fetchBaselines(tenantId, ['camp-1'], defaultDateRange);
        node_assert_1.strict.deepStrictEqual(Array.from(baselines1.entries()), Array.from(baselines2.entries()));
    });
    (0, node_test_1.it)('produces different metrics for different seeds', async () => {
        const context1 = (0, simulation_context_1.createSimulationContext)({
            tenantId,
            scenarioName: 'test',
            dateRange: defaultDateRange,
            mode: 'GENERATED',
            seed: 'seed-A',
        });
        const context2 = (0, simulation_context_1.createSimulationContext)({
            tenantId,
            scenarioName: 'test',
            dateRange: defaultDateRange,
            mode: 'GENERATED',
            seed: 'seed-B',
        });
        const provider1 = new mock_metric_provider_1.MockMetricProvider(context1);
        const provider2 = new mock_metric_provider_1.MockMetricProvider(context2);
        const snapshots1 = await provider1.fetchSnapshots(tenantId, defaultDateRange);
        const snapshots2 = await provider2.fetchSnapshots(tenantId, defaultDateRange);
        node_assert_1.strict.notDeepStrictEqual(snapshots1, snapshots2);
    });
    (0, node_test_1.it)('produces consistent values across multiple calls with same instance', async () => {
        const context = (0, simulation_context_1.createSimulationContext)({
            tenantId,
            scenarioName: 'test',
            dateRange: defaultDateRange,
            mode: 'GENERATED',
            seed: 'stable-seed',
        });
        const provider = new mock_metric_provider_1.MockMetricProvider(context);
        const run1 = await provider.fetchSnapshots(tenantId, defaultDateRange);
        const run2 = await provider.fetchSnapshots(tenantId, defaultDateRange);
        node_assert_1.strict.notDeepStrictEqual(run1, run2);
    });
});
//# sourceMappingURL=mock-metric.provider.test.js.map