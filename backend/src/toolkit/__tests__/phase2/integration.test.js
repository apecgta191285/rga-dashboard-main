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
const seed_unified_command_1 = require("../../commands/seed-unified.command");
const mockLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => mockLogger
};
const mockPrisma = {
    metric: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findFirst: async () => null },
    campaign: { deleteMany: async () => ({ count: 0 }), create: async () => ({ id: 'camp-1' }), findFirst: async () => null },
    $transaction: async (cb) => cb(mockPrisma),
    $queryRaw: async () => ([
        { column_name: 'is_mock_data' },
        { column_name: 'source' },
    ]),
};
const mockLoader = {
    load: async (name) => ({
        schemaVersion: '1.0.0',
        scenarioId: 'test-scenario',
        name: 'Test Scenario',
        trend: 'STABLE',
        days: 30
    })
};
const mockFixtureProvider = {
    loadFixture: async (id, seed) => ({
        schemaVersion: '1.0.0',
        scenarioId: id,
        seed,
        checksum: 'sha256:mock',
        shape: {
            totalCampaigns: 1,
            totalMetricRows: 100,
            perPlatform: { GOOGLE_ADS: { campaigns: 1, metricRows: 100 } },
        },
        samples: []
    })
};
function deepSortKeys(input) {
    if (input === null || typeof input !== 'object')
        return input;
    if (Array.isArray(input))
        return input.map((v) => deepSortKeys(v));
    const out = {};
    for (const key of Object.keys(input).sort()) {
        out[key] = deepSortKeys(input[key]);
    }
    return out;
}
function checksumShape(shape) {
    const canonical = JSON.stringify(deepSortKeys(shape));
    const hash = require('crypto').createHash('sha256').update(canonical, 'utf-8').digest('hex');
    return `sha256:${hash}`;
}
const createHandler = () => new seed_unified_command_1.SeedUnifiedCommandHandler(mockLogger, mockPrisma, mockLoader, mockFixtureProvider);
(0, node_test_1.describe)('SeedUnifiedCommandHandler Integration (Phase 2)', () => {
    let originalToolkitEnv;
    let originalDbUrl;
    (0, node_test_1.beforeEach)(() => {
        originalToolkitEnv = process.env.TOOLKIT_ENV;
        originalDbUrl = process.env.DATABASE_URL;
        process.env.TOOLKIT_ENV = 'CI';
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    });
    (0, node_test_1.afterEach)(() => {
        process.env.TOOLKIT_ENV = originalToolkitEnv;
        process.env.DATABASE_URL = originalDbUrl;
    });
    (0, node_test_1.test)('should execute GENERATED mode (Test 21)', async () => {
        const handler = createHandler();
        const params = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 123,
            days: 1,
            dryRun: true
        };
        const result = await handler.runWithManifest(params);
        if (result.status !== 'SUCCESS') {
        }
        assert.strictEqual(result.status, 'SUCCESS');
        const steps = result.manifest.steps;
        assert.ok(steps.find(s => s.name === 'LOAD_SCENARIO' && s.status === 'SUCCESS'));
        assert.ok(steps.find(s => s.name === 'LOAD_FIXTURES' && s.status === 'SKIPPED'));
        assert.ok(steps.find(s => s.name === 'EXECUTE' && s.status === 'SUCCESS'));
        assert.strictEqual(result.manifest.results.writesApplied?.actualCounts?.totalRows, 0);
        assert.ok((result.manifest.results.writesPlanned?.estimatedCounts?.totalRows ?? 0) > 0);
    });
    (0, node_test_1.test)('should execute FIXTURE mode (Test 22)', async () => {
        const handler = createHandler();
        const params = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'FIXTURE',
            seed: 123,
            dryRun: true
        };
        const result = await handler.runWithManifest(params);
        assert.strictEqual(result.status, 'SUCCESS');
        const steps = result.manifest.steps;
        assert.ok(steps.find(s => s.name === 'LOAD_FIXTURES' && s.status === 'SUCCESS'));
        const execStep = steps.find(s => s.name === 'EXECUTE');
        assert.strictEqual(execStep?.status, 'SUCCESS');
        assert.ok(execStep?.summary.includes('Generation bypassed'));
        assert.strictEqual(steps.find(s => s.name === 'VERIFY'), undefined);
    });
    (0, node_test_1.test)('should execute HYBRID mode and pass if matches (Test 23)', async () => {
        const handler = createHandler();
        const mockEngine = {
            generateDateRangeMetrics: () => [{ date: new Date(), metrics: {} }]
        };
        handler.engine = mockEngine;
        const expectedShape = {
            totalCampaigns: 1,
            totalMetricRows: 1,
            perPlatform: { GOOGLE_ADS: { campaigns: 1, metricRows: 1 } },
        };
        mockFixtureProvider.loadFixture = async () => ({
            shape: expectedShape,
            checksum: checksumShape(expectedShape)
        });
        const params = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'HYBRID',
            seed: 123,
            days: 1,
            platforms: 'google',
            dryRun: true
        };
        const result = await handler.runWithManifest(params);
        assert.strictEqual(result.status, 'SUCCESS');
        const steps = result.manifest.steps;
        assert.ok(steps.find(s => s.name === 'LOAD_FIXTURES' && s.status === 'SUCCESS'));
        assert.ok(steps.find(s => s.name === 'EXECUTE' && s.status === 'SUCCESS'));
    });
    (0, node_test_1.test)('should fail HYBRID mode if mismatch (Test 24)', async () => {
        const handler = createHandler();
        handler.engine = {
            generateDateRangeMetrics: () => [{ date: new Date(), metrics: {} }]
        };
        const expectedShape = {
            totalCampaigns: 1,
            totalMetricRows: 999,
            perPlatform: { GOOGLE_ADS: { campaigns: 1, metricRows: 999 } },
        };
        mockFixtureProvider.loadFixture = async () => ({
            shape: expectedShape,
            checksum: checksumShape(expectedShape)
        });
        const params = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'HYBRID',
            seed: 123,
            days: 1,
            platforms: 'google',
            dryRun: true
        };
        const result = await handler.runWithManifest(params);
        assert.notStrictEqual(result.status, 'SUCCESS');
        const execStep = result.manifest.steps.find(s => s.name === 'EXECUTE');
        assert.strictEqual(execStep?.status, 'FAILED');
        assert.ok(execStep?.summary.includes('generated shape does not match fixture shape'));
    });
    (0, node_test_1.test)('should parse line/shopee/lazada platform CSV for unified seed', async () => {
        const handler = createHandler();
        const params = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 123,
            days: 1,
            platforms: 'line,shopee,lazada',
            dryRun: true
        };
        const result = await handler.runWithManifest(params);
        assert.strictEqual(result.status, 'SUCCESS');
        const execStep = result.manifest.steps.find(s => s.name === 'EXECUTE');
        assert.strictEqual(execStep?.status, 'SUCCESS');
        assert.ok(execStep?.summary.includes('LINE_ADS'));
        assert.ok(execStep?.summary.includes('SHOPEE'));
        assert.ok(execStep?.summary.includes('LAZADA'));
    });
    (0, node_test_1.test)('should block non-seedable platform input in unified seed CSV', async () => {
        const handler = createHandler();
        const params = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 123,
            days: 1,
            platforms: 'instagram',
            dryRun: true
        };
        const result = await handler.runWithManifest(params);
        assert.strictEqual(result.status, 'BLOCKED');
        assert.strictEqual(result.exitCode, 78);
        const validationStep = result.manifest.steps.find(s => s.name === 'VALIDATE_INPUT');
        assert.strictEqual(validationStep?.status, 'FAILED');
        assert.ok(validationStep?.summary.includes('non-seedable'));
        assert.ok(validationStep?.summary.includes('Allowed seedable platforms'));
    });
});
//# sourceMappingURL=integration.test.js.map