"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const alert_execution_service_1 = require("../alert-execution.service");
const alert_engine_service_1 = require("../alert-engine.service");
const NOW = new Date('2024-01-15T09:00:00.000Z');
const TENANT = 'tenant-test';
function makeCtx(overrides = {}) {
    return {
        tenantId: overrides.tenantId ?? TENANT,
        executionTime: overrides.executionTime ?? NOW,
        dryRun: overrides.dryRun ?? false,
        executionMode: overrides.executionMode ?? 'MANUAL',
        correlationId: overrides.correlationId,
        triggeredBy: overrides.triggeredBy,
    };
}
function makeRule(id, condition, enabled = true) {
    return {
        id,
        name: `Rule ${id}`,
        condition,
        severity: 'MEDIUM',
        enabled,
    };
}
function thresholdRule(id, metric, op, value, enabled = true) {
    return makeRule(id, { type: 'THRESHOLD', metric, operator: op, value }, enabled);
}
function makeSnapshot(campaignId, overrides = {}) {
    return {
        tenantId: TENANT,
        campaignId,
        date: NOW,
        platform: 'google_ads',
        metrics: {
            impressions: 1000,
            clicks: 50,
            conversions: 5,
            spend: 100,
            revenue: 500,
            ctr: 0.05,
            cpc: 2,
            cvr: 0.1,
            roas: 5,
            ...overrides,
        },
    };
}
function makeRuleProvider(rules) {
    return {
        resolveRules: async (_tenantId) => rules,
    };
}
function makeMetricProvider(snapshots, baselines) {
    const provider = {
        fetchSnapshots: async () => snapshots,
    };
    if (baselines) {
        provider.fetchBaselines = async () => baselines;
    }
    return provider;
}
function makeAlertEngine(result) {
    const engine = Object.create(alert_engine_service_1.AlertEngine.prototype);
    engine.evaluateCheck = (_snapshots, _rules, _context, _baselines) => result;
    return engine;
}
function noTriggersResult() {
    return {
        triggeredAlerts: [],
        evaluatedAt: NOW,
        context: { tenantId: TENANT, dateRange: { start: NOW, end: NOW }, dryRun: false },
        metadata: { totalRules: 1, enabledRules: 1, triggeredCount: 0, durationMs: 1 },
    };
}
function triggeredResult(alerts) {
    return {
        triggeredAlerts: alerts,
        evaluatedAt: NOW,
        context: { tenantId: TENANT, dateRange: { start: NOW, end: NOW }, dryRun: false },
        metadata: {
            totalRules: 1,
            enabledRules: 1,
            triggeredCount: alerts.length,
            durationMs: 1,
        },
    };
}
(0, node_test_1.describe)('AlertExecutionService — context validation', () => {
    const engine = makeAlertEngine(noTriggersResult());
    const service = new alert_execution_service_1.AlertExecutionService(engine);
    const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
    const metrics = makeMetricProvider([makeSnapshot('c1')]);
    (0, node_test_1.it)('fails when tenantId is missing', async () => {
        const ctx = makeCtx({ tenantId: '' });
        const result = await service.execute(ctx, rules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'FAILED');
        node_assert_1.strict.ok(result.error?.message.includes('tenantId'));
    });
    (0, node_test_1.it)('fails when executionMode is missing', async () => {
        const ctx = makeCtx({ executionMode: '' });
        const result = await service.execute(ctx, rules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'FAILED');
        node_assert_1.strict.ok(result.error?.message.includes('executionMode'));
    });
});
(0, node_test_1.describe)('AlertExecutionService — no enabled rules', () => {
    const engine = makeAlertEngine(noTriggersResult());
    const service = new alert_execution_service_1.AlertExecutionService(engine);
    (0, node_test_1.it)('returns COMPLETED with zero counts when all rules disabled', async () => {
        const disabledRules = makeRuleProvider([
            thresholdRule('r1', 'spend', 'GT', 50, false),
            thresholdRule('r2', 'clicks', 'LT', 10, false),
        ]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result = await service.execute(makeCtx(), disabledRules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'COMPLETED');
        node_assert_1.strict.strictEqual(result.summary.enabledRules, 0);
        node_assert_1.strict.strictEqual(result.summary.triggeredCount, 0);
        node_assert_1.strict.strictEqual(result.triggeredAlerts.length, 0);
    });
    (0, node_test_1.it)('returns COMPLETED when rule list is empty', async () => {
        const emptyRules = makeRuleProvider([]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result = await service.execute(makeCtx(), emptyRules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'COMPLETED');
        node_assert_1.strict.strictEqual(result.summary.totalRules, 0);
    });
});
(0, node_test_1.describe)('AlertExecutionService — no metric snapshots', () => {
    const engine = makeAlertEngine(noTriggersResult());
    const service = new alert_execution_service_1.AlertExecutionService(engine);
    (0, node_test_1.it)('returns COMPLETED when no snapshots available', async () => {
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([]);
        const result = await service.execute(makeCtx(), rules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'COMPLETED');
        node_assert_1.strict.strictEqual(result.summary.snapshotsEvaluated, 0);
    });
});
(0, node_test_1.describe)('AlertExecutionService — successful execution with triggers', () => {
    (0, node_test_1.it)('returns triggered alerts and correct summary', async () => {
        const triggerAlert = {
            ruleId: 'r1',
            ruleName: 'Rule r1',
            condition: { type: 'THRESHOLD', metric: 'spend', operator: 'GT', value: 50 },
            severity: 'HIGH',
            triggered: true,
            reason: 'spend (100) > 50',
            evaluatedAt: NOW,
            values: { current: 100, threshold: 50 },
        };
        const engine = makeAlertEngine(triggeredResult([triggerAlert]));
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result = await service.execute(makeCtx(), rules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'COMPLETED');
        node_assert_1.strict.strictEqual(result.triggeredAlerts.length, 1);
        node_assert_1.strict.strictEqual(result.triggeredAlerts[0].rule.id, 'r1');
        node_assert_1.strict.strictEqual(result.triggeredAlerts[0].triggered, true);
        node_assert_1.strict.strictEqual(result.summary.triggeredCount, 1);
        node_assert_1.strict.strictEqual(result.summary.enabledRules, 1);
    });
});
(0, node_test_1.describe)('AlertExecutionService — successful execution with no triggers', () => {
    (0, node_test_1.it)('returns empty triggeredAlerts and status COMPLETED', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 99999)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result = await service.execute(makeCtx(), rules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'COMPLETED');
        node_assert_1.strict.strictEqual(result.triggeredAlerts.length, 0);
        node_assert_1.strict.strictEqual(result.summary.triggeredCount, 0);
        node_assert_1.strict.strictEqual(result.summary.notTriggeredCount, 1);
    });
});
(0, node_test_1.describe)('AlertExecutionService — error handling', () => {
    (0, node_test_1.it)('returns FAILED when ruleProvider throws', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const brokenRules = {
            resolveRules: async () => { throw new Error('DB connection lost'); },
        };
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result = await service.execute(makeCtx(), brokenRules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'FAILED');
        node_assert_1.strict.strictEqual(result.error?.code, 'EXECUTION_FAILED');
        node_assert_1.strict.ok(result.error?.message.includes('DB connection lost'));
    });
    (0, node_test_1.it)('returns FAILED when metricProvider throws', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const brokenMetrics = {
            fetchSnapshots: async () => { throw new Error('API timeout'); },
        };
        const result = await service.execute(makeCtx(), rules, brokenMetrics);
        node_assert_1.strict.strictEqual(result.status, 'FAILED');
        node_assert_1.strict.ok(result.error?.message.includes('API timeout'));
    });
    (0, node_test_1.it)('returns FAILED when alertEngine throws', async () => {
        const engine = Object.create(alert_engine_service_1.AlertEngine.prototype);
        engine.evaluateCheck = () => { throw new Error('Engine crash'); };
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result = await service.execute(makeCtx(), rules, metrics);
        node_assert_1.strict.strictEqual(result.status, 'FAILED');
        node_assert_1.strict.ok(result.error?.message.includes('Engine crash'));
    });
});
(0, node_test_1.describe)('AlertExecutionService — timing and runId', () => {
    (0, node_test_1.it)('records positive durationMs', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result = await service.execute(makeCtx(), rules, metrics);
        node_assert_1.strict.ok(result.timing.durationMs >= 0);
        node_assert_1.strict.ok(result.timing.startedAt instanceof Date);
        node_assert_1.strict.ok(result.timing.completedAt instanceof Date);
    });
    (0, node_test_1.it)('generates unique runId per execution', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result1 = await service.execute(makeCtx(), rules, metrics);
        const result2 = await service.execute(makeCtx(), rules, metrics);
        node_assert_1.strict.notStrictEqual(result1.runId, result2.runId);
        node_assert_1.strict.ok(result1.runId.startsWith('exec-'));
        node_assert_1.strict.ok(result2.runId.startsWith('exec-'));
    });
});
(0, node_test_1.describe)('AlertExecutionService — summary statistics', () => {
    (0, node_test_1.it)('counts total vs enabled rules correctly', async () => {
        const triggerAlert = {
            ruleId: 'r1',
            ruleName: 'Rule r1',
            condition: { type: 'THRESHOLD', metric: 'spend', operator: 'GT', value: 50 },
            severity: 'MEDIUM',
            triggered: true,
            reason: 'spend > 50',
            evaluatedAt: NOW,
            values: { current: 100, threshold: 50 },
        };
        const engine = makeAlertEngine(triggeredResult([triggerAlert]));
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([
            thresholdRule('r1', 'spend', 'GT', 50, true),
            thresholdRule('r2', 'clicks', 'LT', 10, false),
            thresholdRule('r3', 'ctr', 'GT', 0.01, true),
        ]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const result = await service.execute(makeCtx(), rules, metrics);
        node_assert_1.strict.strictEqual(result.summary.totalRules, 3);
        node_assert_1.strict.strictEqual(result.summary.enabledRules, 2);
        node_assert_1.strict.strictEqual(result.summary.snapshotsEvaluated, 1);
    });
});
(0, node_test_1.describe)('AlertExecutionService — baselines delegation', () => {
    (0, node_test_1.it)('calls fetchBaselines when provider supports it', async () => {
        let baselinesCalled = false;
        const engine = makeAlertEngine(noTriggersResult());
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const provider = {
            fetchSnapshots: async () => [makeSnapshot('c1')],
            fetchBaselines: async () => {
                baselinesCalled = true;
                return new Map();
            },
        };
        await service.execute(makeCtx(), rules, provider);
        node_assert_1.strict.strictEqual(baselinesCalled, true);
    });
    (0, node_test_1.it)('skips baselines when fetchBaselines is absent', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const provider = {
            fetchSnapshots: async () => [makeSnapshot('c1')],
        };
        const result = await service.execute(makeCtx(), rules, provider);
        node_assert_1.strict.strictEqual(result.status, 'COMPLETED');
    });
});
(0, node_test_1.describe)('AlertExecutionService — context preservation', () => {
    (0, node_test_1.it)('result.context matches input context', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new alert_execution_service_1.AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);
        const inputCtx = makeCtx({
            tenantId: 'tenant-abc',
            executionMode: 'SCHEDULED',
            dryRun: true,
            correlationId: 'corr-123',
            triggeredBy: 'admin-user',
        });
        const result = await service.execute(inputCtx, rules, metrics);
        node_assert_1.strict.strictEqual(result.context.tenantId, 'tenant-abc');
        node_assert_1.strict.strictEqual(result.context.executionMode, 'SCHEDULED');
        node_assert_1.strict.strictEqual(result.context.dryRun, true);
        node_assert_1.strict.strictEqual(result.context.correlationId, 'corr-123');
        node_assert_1.strict.strictEqual(result.context.triggeredBy, 'admin-user');
    });
});
//# sourceMappingURL=alert-execution.service.test.js.map