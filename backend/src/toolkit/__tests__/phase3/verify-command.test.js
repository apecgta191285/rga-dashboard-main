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
const verify_scenario_command_1 = require("../../commands/verify-scenario.command");
const core_1 = require("../../core");
const mockLogger = {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { },
    log: () => { }
};
const mockPrisma = {};
const mockLoader = {
    load: async (id) => ({ scenarioId: id, name: 'Test', trend: 'GROWTH' })
};
(0, node_test_1.describe)('VerifyScenarioCommand Check (Phase 3)', () => {
    let handler;
    let mockVerificationService;
    let mockReportWriter;
    (0, node_test_1.beforeEach)(() => {
        mockVerificationService = {
            verifyScenario: async () => ({
                meta: {
                    version: '1.0.0',
                    generator: 'test',
                    createdAt: new Date().toISOString(),
                    runId: 'run-1',
                    scenarioId: 'baseline',
                    tenantId: 'tenant-1',
                },
                summary: {
                    status: 'PASS',
                    totalChecks: 1,
                    passed: 1,
                    failed: 0,
                    warnings: 0,
                    durationMs: 1,
                },
                results: [],
                provenance: {
                    isMockData: true,
                    sourcePrefix: 'toolkit:',
                },
            }),
        };
        mockReportWriter = {
            writeReport: async () => 'artifacts/reports/verify-mock.json',
        };
        handler = new verify_scenario_command_1.VerifyScenarioCommandHandler(mockLogger, mockPrisma, mockLoader, mockVerificationService, mockReportWriter);
    });
    (0, node_test_1.test)('Should validate required parameters', () => {
        const cmd = new verify_scenario_command_1.VerifyScenarioCommand({ scenarioId: '', tenantId: '' });
        const result = handler.validate(cmd);
        assert.ok(result.kind === 'failure');
        assert.match(result.error.message, /Scenario ID is required/);
    });
    (0, node_test_1.test)('Should validate tenant ID', () => {
        const cmd = new verify_scenario_command_1.VerifyScenarioCommand({ scenarioId: 'test', tenantId: '' });
        const result = handler.validate(cmd);
        assert.ok(result.kind === 'failure');
        assert.match(result.error.message, /Tenant ID is required/);
    });
    (0, node_test_1.test)('Should pass validation with valid params', () => {
        const cmd = new verify_scenario_command_1.VerifyScenarioCommand({ scenarioId: 'test', tenantId: 'tenant-1' });
        const result = handler.validate(cmd);
        assert.ok(result.kind === 'success');
    });
    (0, node_test_1.test)('Should map WARN summary semantics deterministically', async () => {
        handler.runWithManifest = async () => ({
            status: 'SUCCESS',
            exitCode: 0,
            manifestPath: 'toolkit-manifests/mock.manifest.json',
            manifest: {
                status: 'SUCCESS',
                steps: [
                    {
                        name: 'VERIFY',
                        summary: 'Verification WARN: 8 passed, 0 failed, 2 warnings.',
                    },
                ],
                results: {
                    filesystemWrites: {
                        pathsMasked: ['artifacts/reports/verify-mock.json'],
                    },
                },
            },
        });
        const cmd = new verify_scenario_command_1.VerifyScenarioCommand({ scenarioId: 'baseline', tenantId: 'tenant-1' });
        const context = core_1.ExecutionContextFactory.create({
            tenantId: 'tenant-1',
            runId: 'run-1',
            dryRun: false,
            verbose: true,
            logger: mockLogger,
            printer: {
                log: () => { },
                warn: () => { },
                error: () => { },
                header: () => { },
                spinner: () => ({ start: () => { }, succeed: () => { }, fail: () => { }, stop: () => { } }),
            },
        });
        const result = await handler.execute(cmd, context);
        assert.ok(result.kind === 'success');
        assert.strictEqual(result.value.status, 'WARN');
        assert.deepStrictEqual(result.value.summary, {
            status: 'WARN',
            passed: 8,
            failed: 0,
            warnings: 2,
        });
    });
});
//# sourceMappingURL=verify-command.test.js.map