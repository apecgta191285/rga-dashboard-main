"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const seed_unified_command_1 = require("../commands/seed-unified.command");
process.env.TOOLKIT_ENV = 'CI';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test_db';
const mockLogger = {
    info: node_test_1.mock.fn(),
    warn: node_test_1.mock.fn(),
    error: node_test_1.mock.fn(),
    success: node_test_1.mock.fn(),
    debug: node_test_1.mock.fn(),
    child: node_test_1.mock.fn(() => mockLogger),
};
const mockPrismaTx = {
    campaign: { create: node_test_1.mock.fn(() => Promise.resolve({ id: 'cmd-1' })) },
    metric: { createMany: node_test_1.mock.fn(() => Promise.resolve({ count: 10 })) }
};
const mockPrisma = {
    metric: {
        findFirst: node_test_1.mock.fn(),
        deleteMany: node_test_1.mock.fn(),
        createMany: node_test_1.mock.fn()
    },
    campaign: {
        findFirst: node_test_1.mock.fn(),
        deleteMany: node_test_1.mock.fn(),
        createMany: node_test_1.mock.fn(),
        create: node_test_1.mock.fn()
    },
    $transaction: node_test_1.mock.fn((cb) => cb(mockPrismaTx)),
    $queryRaw: node_test_1.mock.fn(() => Promise.resolve([
        { column_name: 'is_mock_data' },
        { column_name: 'source' },
    ])),
};
(0, node_test_1.describe)('Phase 1C: Unified Seeding Contract', () => {
    let handler;
    (0, node_test_1.beforeEach)(() => {
        mockLogger.info = node_test_1.mock.fn();
        mockLogger.warn = node_test_1.mock.fn();
        mockPrisma.metric.findFirst = node_test_1.mock.fn(() => Promise.resolve(null));
        mockPrisma.metric.deleteMany = node_test_1.mock.fn(() => Promise.resolve({ count: 0 }));
        mockPrisma.campaign.findFirst = node_test_1.mock.fn(() => Promise.resolve(null));
        mockPrisma.campaign.deleteMany = node_test_1.mock.fn(() => Promise.resolve({ count: 0 }));
        mockPrismaTx.metric.createMany = node_test_1.mock.fn(() => Promise.resolve({ count: 10 }));
        mockPrismaTx.campaign.create = node_test_1.mock.fn(() => Promise.resolve({ id: 'cmd-1' }));
        mockPrisma.$transaction = node_test_1.mock.fn((cb) => cb(mockPrismaTx));
        mockPrisma.$queryRaw = node_test_1.mock.fn(() => Promise.resolve([
            { column_name: 'is_mock_data' },
            { column_name: 'source' },
        ]));
        const mockScenarioLoader = {
            load: node_test_1.mock.fn(() => Promise.resolve({
                schemaVersion: '1.0.0',
                scenarioId: 'baseline',
                name: 'Baseline',
                trend: 'STABLE',
                baseImpressions: 10000,
                days: 30
            }))
        };
        const mockFixtureProvider = {
            loadFixture: node_test_1.mock.fn(() => Promise.resolve(null)),
            validateChecksum: node_test_1.mock.fn(() => true)
        };
        handler = new seed_unified_command_1.SeedUnifiedCommandHandler(mockLogger, mockPrisma, mockScenarioLoader, mockFixtureProvider);
    });
    (0, node_test_1.it)('Hygiene: Should return BLOCKED (Exit 78) if Real data exists and no override', async () => {
        mockPrisma.metric.findFirst = node_test_1.mock.fn(() => Promise.resolve({ id: 'real-1', isMockData: false }));
        const result = await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 123, days: 1, dryRun: false, allowRealTenant: false,
        });
        node_assert_1.default.strictEqual(result.status, 'BLOCKED', 'Status must be BLOCKED');
        node_assert_1.default.strictEqual(result.exitCode, 78, 'Exit code must be 78');
        const hygieneStep = result.manifest.steps.find((s) => s.name === 'VALIDATE_INPUT');
        node_assert_1.default.ok(hygieneStep, 'Must have VALIDATE_INPUT step');
        node_assert_1.default.strictEqual(hygieneStep.status, 'FAILED', 'VALIDATE_INPUT must be FAILED');
    });
    (0, node_test_1.it)('Determinism: Same seed should produce identical outputs', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 999, days: 1, dryRun: false, platforms: 'google'
        });
        node_assert_1.default.ok(mockPrismaTx.metric.createMany.mock.calls.length > 0, 'Should call createMany');
        const firstCallArgs = mockPrismaTx.metric.createMany.mock.calls[0].arguments[0];
        mockPrismaTx.metric.createMany = node_test_1.mock.fn(() => Promise.resolve({ count: 10 }));
        mockPrismaTx.campaign.create = node_test_1.mock.fn(() => Promise.resolve({ id: 'cmd-1' }));
        mockPrisma.metric.deleteMany = node_test_1.mock.fn(() => Promise.resolve({ count: 0 }));
        mockPrisma.campaign.deleteMany = node_test_1.mock.fn(() => Promise.resolve({ count: 0 }));
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 999, days: 1, dryRun: false, platforms: 'google'
        });
        const secondCallArgs = mockPrismaTx.metric.createMany.mock.calls[0].arguments[0];
        node_assert_1.default.deepStrictEqual(firstCallArgs, secondCallArgs, 'Outputs must match exactly for same seed');
    });
    (0, node_test_1.it)('Subset Stability: Platform output should be independent of peers', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 555, days: 1, dryRun: false, platforms: 'google'
        });
        const googleOnlyOutput = mockPrismaTx.metric.createMany.mock.calls[0].arguments[0].data;
        mockPrismaTx.metric.createMany = node_test_1.mock.fn(() => Promise.resolve({ count: 10 }));
        mockPrismaTx.campaign.create = node_test_1.mock.fn(() => Promise.resolve({ id: 'cmd-1' }));
        mockPrisma.metric.deleteMany = node_test_1.mock.fn(() => Promise.resolve({ count: 0 }));
        mockPrisma.campaign.deleteMany = node_test_1.mock.fn(() => Promise.resolve({ count: 0 }));
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 555, days: 1, dryRun: false, platforms: 'google,facebook'
        });
        const calls = mockPrismaTx.metric.createMany.mock.calls;
        const googleCall = calls.find((c) => c.arguments[0].data[0].platform === 'GOOGLE_ADS');
        node_assert_1.default.ok(googleCall, 'Google Ads data should be generated in multi-run');
        const googleMultiOutput = googleCall.arguments[0].data;
        node_assert_1.default.deepStrictEqual(googleOnlyOutput, googleMultiOutput, 'Google output must be identical regardless of Facebook presence');
    });
    (0, node_test_1.it)('Idempotency: Should delete before writing', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 111, days: 1, dryRun: false, platforms: 'google'
        });
        const deleteCalls = mockPrisma.metric.deleteMany.mock.calls;
        node_assert_1.default.strictEqual(deleteCalls.length, 1, 'Should call deleteMany once');
        const deleteArgs = deleteCalls[0].arguments[0];
        node_assert_1.default.strictEqual(deleteArgs.where.tenantId, 't1');
        node_assert_1.default.strictEqual(deleteArgs.where.isMockData, true);
        node_assert_1.default.ok(deleteArgs.where.source.startsWith('toolkit:unified:baseline:111'), 'Should target specific source tag');
    });
    (0, node_test_1.it)('Idempotency: Campaign cleanup must be scoped per platform in multi-platform run', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 222, days: 1, dryRun: false, platforms: 'google,facebook'
        });
        const campaignDeleteCalls = mockPrisma.campaign.deleteMany.mock.calls;
        node_assert_1.default.strictEqual(campaignDeleteCalls.length, 2, 'Should clean campaigns once per selected platform');
        const deletedPlatforms = campaignDeleteCalls
            .map((call) => call.arguments[0]?.where?.platform)
            .filter(Boolean)
            .sort();
        node_assert_1.default.deepStrictEqual(deletedPlatforms, ['FACEBOOK', 'GOOGLE_ADS'], 'Campaign delete scope must be platform-specific to avoid cross-platform cascade deletes');
    });
    (0, node_test_1.it)('Date window: days=1 should generate exactly one daily metric row per platform', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 333, days: 1, dryRun: false, platforms: 'google'
        });
        const metricCalls = mockPrismaTx.metric.createMany.mock.calls;
        node_assert_1.default.ok(metricCalls.length > 0, 'Should write metric rows');
        const firstBatch = metricCalls[0].arguments[0].data;
        node_assert_1.default.strictEqual(firstBatch.length, 1, 'days=1 must produce exactly one row');
    });
    (0, node_test_1.it)('Provenance: All writes must have isMockData=true and source=toolkit:unified:*', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'growth', seed: 777, days: 1, dryRun: false, platforms: 'google'
        });
        const campaignCalls = mockPrismaTx.campaign.create.mock.calls;
        node_assert_1.default.ok(campaignCalls.length > 0, 'Should create at least one campaign');
        const campaignData = campaignCalls[0].arguments[0].data;
        node_assert_1.default.strictEqual(campaignData.isMockData, true, 'Campaign must have isMockData=true');
        node_assert_1.default.ok(campaignData.source.startsWith('toolkit:unified:growth:777'), 'Campaign source must be toolkit:unified:*');
        const metricCalls = mockPrismaTx.metric.createMany.mock.calls;
        node_assert_1.default.ok(metricCalls.length > 0, 'Should create metrics');
        const metricRows = metricCalls[0].arguments[0].data;
        for (const row of metricRows) {
            node_assert_1.default.strictEqual(row.isMockData, true, `Metric row must have isMockData=true`);
            node_assert_1.default.ok(row.source.startsWith('toolkit:unified:growth:777'), `Metric source must be toolkit:unified:*, got: ${row.source}`);
        }
    });
    (0, node_test_1.it)('Determinism: externalId must NOT contain Date.now()', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 42, days: 1, dryRun: false, platforms: 'google'
        });
        const campaignCalls = mockPrismaTx.campaign.create.mock.calls;
        node_assert_1.default.ok(campaignCalls.length > 0, 'Should create a campaign');
        const externalId = campaignCalls[0].arguments[0].data.externalId;
        node_assert_1.default.ok(externalId.startsWith('unified-baseline-42-'), `externalId must be deterministic, got: ${externalId}`);
        node_assert_1.default.ok(!/\d{13}/.test(externalId), `externalId must NOT contain Date.now() timestamp, got: ${externalId}`);
    });
    (0, node_test_1.it)('Manifest: runWithManifest should produce manifest with expected structure', async () => {
        const result = await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 321, days: 1, dryRun: false, platforms: 'google'
        });
        node_assert_1.default.ok(result.manifest, 'Must produce a manifest');
        node_assert_1.default.strictEqual(result.manifest.invocation.commandName, 'seed-unified-scenario');
        node_assert_1.default.strictEqual(result.manifest.invocation.commandClassification, 'WRITE');
        const stepNames = result.manifest.steps.map((s) => s.name);
        node_assert_1.default.ok(stepNames.includes('SAFETY_CHECK'), 'Manifest must include SAFETY_CHECK step');
        node_assert_1.default.ok(stepNames.includes('LOAD_SCENARIO'), 'Manifest must include LOAD_SCENARIO step');
        node_assert_1.default.ok(stepNames.includes('VALIDATE_SCENARIO'), 'Manifest must include VALIDATE_SCENARIO step');
        node_assert_1.default.ok(stepNames.includes('VALIDATE_INPUT'), 'Manifest must include VALIDATE_INPUT step');
        node_assert_1.default.ok(stepNames.includes('EXECUTE'), 'Manifest must include EXECUTE step');
        node_assert_1.default.ok(stepNames.includes('VERIFY'), 'Manifest must include VERIFY step');
        node_assert_1.default.strictEqual(result.status, 'SUCCESS');
        node_assert_1.default.strictEqual(result.exitCode, 0);
    });
    (0, node_test_1.it)('Manifest: Should produce BLOCKED manifest when hygiene fails', async () => {
        mockPrisma.metric.findFirst = node_test_1.mock.fn(() => Promise.resolve({ id: 'real-1', isMockData: false }));
        const result = await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 999, days: 1, dryRun: false, platforms: 'google',
            allowRealTenant: false,
        });
        node_assert_1.default.ok(result.manifest, 'Must produce a manifest even when blocked');
        node_assert_1.default.strictEqual(result.status, 'BLOCKED');
        node_assert_1.default.strictEqual(result.exitCode, 78);
        const hygieneStep = result.manifest.steps.find((s) => s.name === 'VALIDATE_INPUT');
        node_assert_1.default.ok(hygieneStep, 'Must have VALIDATE_INPUT step');
        node_assert_1.default.strictEqual(hygieneStep.status, 'FAILED');
    });
});
//# sourceMappingURL=seed-unified.test.js.map