"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const manifest_builder_1 = require("../manifest-builder");
const types_1 = require("../types");
function createBuilder(overrides) {
    return new manifest_builder_1.ManifestBuilder({
        executionMode: 'CLI',
        commandName: 'test-cmd',
        commandClassification: 'WRITE',
        ...overrides,
    });
}
(0, node_test_1.describe)('ManifestBuilder init', () => {
    (0, node_test_1.it)('generates a v4 UUID runId', () => {
        const b = createBuilder();
        node_assert_1.strict.match(b.getRunId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
    (0, node_test_1.it)('defaults to BLOCKED status', () => {
        const doc = createBuilder().emergencyFinalize();
        node_assert_1.strict.strictEqual(doc.status, 'BLOCKED');
        node_assert_1.strict.strictEqual(doc.exitCode, 78);
    });
    (0, node_test_1.it)('sets schema version', () => {
        const doc = createBuilder().finalize('SUCCESS', 0);
        node_assert_1.strict.strictEqual(doc.schemaVersion, types_1.MANIFEST_SCHEMA_VERSION);
    });
});
(0, node_test_1.describe)('ManifestBuilder steps', () => {
    (0, node_test_1.it)('tracks step start and close', () => {
        const b = createBuilder();
        const step = b.startStep('SAFETY_CHECK');
        step.close({ status: 'SUCCESS', summary: 'All gates passed' });
        const doc = b.finalize('SUCCESS', 0);
        node_assert_1.strict.strictEqual(doc.steps.length, 1);
        node_assert_1.strict.strictEqual(doc.steps[0].name, 'SAFETY_CHECK');
        node_assert_1.strict.strictEqual(doc.steps[0].status, 'SUCCESS');
        node_assert_1.strict.ok(doc.steps[0].durationMs >= 0);
    });
    (0, node_test_1.it)('handles multiple steps', () => {
        const b = createBuilder();
        const s1 = b.startStep('SAFETY_CHECK');
        s1.close({ status: 'SUCCESS', summary: 'ok' });
        const s2 = b.startStep('EXECUTE');
        s2.close({ status: 'SUCCESS', summary: 'done' });
        const doc = b.finalize('SUCCESS', 0);
        node_assert_1.strict.strictEqual(doc.steps.length, 2);
    });
    (0, node_test_1.it)('step errors are captured', () => {
        const b = createBuilder();
        const step = b.startStep('SAFETY_CHECK');
        step.close({
            status: 'FAILED',
            summary: 'gate blocked',
            error: { code: 'SAFETY_BLOCK', message: 'env missing', isRecoverable: false },
        });
        const doc = b.finalize('BLOCKED', 78);
        node_assert_1.strict.strictEqual(doc.steps[0].error?.code, 'SAFETY_BLOCK');
    });
});
(0, node_test_1.describe)('ManifestBuilder setters', () => {
    (0, node_test_1.it)('sets tenant info', () => {
        const b = createBuilder();
        b.setTenant({
            tenantId: 'tenant-123',
            tenantSlug: 'acme',
            tenantDisplayName: 'ACME Corp',
            tenantResolution: 'EXPLICIT',
        });
        const doc = b.finalize('SUCCESS', 0);
        node_assert_1.strict.strictEqual(doc.tenant.tenantId, 'tenant-123');
        node_assert_1.strict.strictEqual(doc.tenant.tenantResolution, 'EXPLICIT');
    });
    (0, node_test_1.it)('sets safety info', () => {
        const b = createBuilder();
        b.setSafety({
            policyVersion: '1.0.0',
            gates: [],
            envSummary: { toolkitEnv: 'LOCAL', classification: 'ALLOWED' },
            dbSafetySummary: { dbHostMasked: 'localhost', dbNameMasked: 'test_db', classification: 'SAFE', matchedRule: 'allowlist:localhost' },
        });
        const doc = b.finalize('SUCCESS', 0);
        node_assert_1.strict.strictEqual(doc.safety.policyVersion, '1.0.0');
    });
    (0, node_test_1.it)('records warnings', () => {
        const b = createBuilder();
        b.addWarning('test warning');
        const doc = b.finalize('SUCCESS', 0);
        node_assert_1.strict.ok(doc.results.warnings.includes('test warning'));
    });
    (0, node_test_1.it)('records errors', () => {
        const b = createBuilder();
        b.addError(new Error('test error'));
        const doc = b.finalize('FAILED', 1);
        node_assert_1.strict.ok(doc.results.errors.length > 0);
    });
});
(0, node_test_1.describe)('ManifestBuilder finalize idempotency', () => {
    (0, node_test_1.it)('second finalize returns same status (ignores new args)', () => {
        const b = createBuilder();
        const doc1 = b.finalize('SUCCESS', 0);
        const doc2 = b.finalize('FAILED', 1);
        node_assert_1.strict.strictEqual(doc2.status, 'SUCCESS');
        node_assert_1.strict.strictEqual(doc2.exitCode, 0);
    });
    (0, node_test_1.it)('isFinalized returns true after first call', () => {
        const b = createBuilder();
        node_assert_1.strict.ok(!b.isFinalized());
        b.finalize('SUCCESS', 0);
        node_assert_1.strict.ok(b.isFinalized());
    });
});
(0, node_test_1.describe)('ManifestBuilder duration', () => {
    (0, node_test_1.it)('records non-negative duration', () => {
        const b = createBuilder();
        const doc = b.finalize('SUCCESS', 0);
        node_assert_1.strict.ok(doc.durationMs >= 0);
    });
});
//# sourceMappingURL=manifest-builder.test.js.map