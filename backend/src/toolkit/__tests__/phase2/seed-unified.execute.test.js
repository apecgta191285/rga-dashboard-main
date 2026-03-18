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
const contracts_1 = require("../../core/contracts");
const mockLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => mockLogger,
};
const mockPrinter = {
    log: () => { },
    warn: () => { },
    error: () => { },
    header: () => { },
    spinner: () => ({ start: () => { }, succeed: () => { }, fail: () => { }, stop: () => { } }),
};
const context = {
    tenantId: (0, contracts_1.createTenantId)('11111111-1111-1111-1111-111111111111'),
    correlationId: 'corr-test',
    startedAt: new Date(),
    dryRun: false,
    verbose: true,
    runId: 'run-test',
    logger: mockLogger,
    printer: mockPrinter,
    with(props) {
        return { ...this, ...props };
    },
    elapsedMs() {
        return 0;
    },
};
const mockPrisma = {
    metric: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findFirst: async () => null },
    campaign: { deleteMany: async () => ({ count: 0 }), create: async () => ({ id: 'camp-1' }), findFirst: async () => null },
    $transaction: async (cb) => cb(mockPrisma),
};
const mockLoader = {
    load: async () => ({
        schemaVersion: '1.0.0',
        scenarioId: 'baseline',
        name: 'Baseline',
        trend: 'STABLE',
        days: 30,
    }),
};
const mockFixtureProvider = {
    loadFixture: async () => ({
        shape: { totalMetricRows: 1 },
        checksum: 'sha256:mock',
    }),
};
(0, node_test_1.describe)('SeedUnifiedCommand.execute status propagation', () => {
    (0, node_test_1.test)('returns failure when pipeline is BLOCKED', async () => {
        const handler = new seed_unified_command_1.SeedUnifiedCommandHandler(mockLogger, mockPrisma, mockLoader, mockFixtureProvider);
        handler.runWithManifest = async () => ({
            status: 'BLOCKED',
            exitCode: 78,
            manifestPath: null,
            manifest: {},
        });
        const command = new seed_unified_command_1.SeedUnifiedCommand({
            tenant: '11111111-1111-1111-1111-111111111111',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 12345,
            days: 1,
            dryRun: false,
        });
        const result = await handler.execute(command, context);
        assert.strictEqual(result.kind, 'failure');
    });
    (0, node_test_1.test)('returns success when pipeline is SUCCESS', async () => {
        const handler = new seed_unified_command_1.SeedUnifiedCommandHandler(mockLogger, mockPrisma, mockLoader, mockFixtureProvider);
        handler.runWithManifest = async () => ({
            status: 'SUCCESS',
            exitCode: 0,
            manifestPath: 'toolkit-manifests/test.manifest.json',
            manifest: {
                results: {
                    writesApplied: {
                        actualCounts: { totalRows: 42 },
                    },
                },
            },
        });
        const command = new seed_unified_command_1.SeedUnifiedCommand({
            tenant: '11111111-1111-1111-1111-111111111111',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 12345,
            days: 1,
            dryRun: false,
        });
        const result = await handler.execute(command, context);
        assert.strictEqual(result.kind, 'success');
        if (result.kind === 'success') {
            assert.strictEqual(result.value.rowsCreated, 42);
        }
    });
});
//# sourceMappingURL=seed-unified.execute.test.js.map