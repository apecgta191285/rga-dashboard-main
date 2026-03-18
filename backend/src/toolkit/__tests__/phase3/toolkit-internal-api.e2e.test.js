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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const supertest_1 = __importDefault(require("supertest"));
const testing_1 = require("@nestjs/testing");
const toolkit_controller_1 = require("../../api/toolkit.controller");
const toolkit_command_executor_service_1 = require("../../api/toolkit-command-executor.service");
const toolkit_internal_guard_1 = require("../../api/toolkit-internal.guard");
const toolkit_query_service_1 = require("../../api/toolkit-query.service");
const toolkit_validation_pipe_1 = require("../../api/toolkit-validation.pipe");
(0, node_test_1.describe)('Toolkit Internal API (e2e)', () => {
    const internalApiKey = 'test-internal-api-key';
    let app;
    const queryServiceMock = {
        getMetrics: async () => ({ metrics: [{ id: 'm1' }], count: 1 }),
        getAlerts: async () => ({ alerts: [{ id: 'a1' }], count: 1 }),
        getAlertHistory: async () => ({ history: [{ id: 'h1' }], count: 1 }),
    };
    const commandExecutorMock = {
        executeCommand: async () => ({
            kind: 'success',
            value: { success: true },
        }),
        issueHardResetToken: () => ({
            token: 'RTH.token.secret',
            expiresAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
    };
    (0, node_test_1.beforeEach)(async () => {
        process.env.NODE_ENV = 'development';
        process.env.TOOLKIT_INTERNAL_API_ENABLED = 'true';
        process.env.TOOLKIT_INTERNAL_API_KEY = internalApiKey;
        const moduleRef = await testing_1.Test.createTestingModule({
            controllers: [toolkit_controller_1.ToolkitController],
            providers: [
                toolkit_internal_guard_1.ToolkitInternalGuard,
                {
                    provide: toolkit_query_service_1.ToolkitQueryService,
                    useValue: queryServiceMock,
                },
                {
                    provide: toolkit_command_executor_service_1.ToolkitCommandExecutorService,
                    useValue: commandExecutorMock,
                },
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes((0, toolkit_validation_pipe_1.createToolkitValidationPipe)());
        await app.init();
    });
    (0, node_test_1.afterEach)(async () => {
        await app.close();
    });
    (0, node_test_1.test)('GET /internal/metrics should return data with internal key', async () => {
        const response = await (0, supertest_1.default)(app.getHttpServer())
            .get('/internal/metrics')
            .query({ tenantId: 'tenant-1' })
            .set('x-toolkit-internal-key', internalApiKey)
            .expect(200);
        assert.strictEqual(response.body.success, true);
        assert.strictEqual(response.body.data.count, 1);
    });
    (0, node_test_1.test)('POST /internal/reset-tenant should reject dryRun=false without confirmWrite', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/internal/reset-tenant')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
            tenantId: 'tenant-1',
            dryRun: false,
            confirmWrite: false,
        })
            .expect(400);
    });
    (0, node_test_1.test)('POST /internal/reset-tenant should pass when confirmWrite=true', async () => {
        let capturedDryRun = null;
        commandExecutorMock.executeCommand = async (_command, params) => {
            capturedDryRun = params.dryRun;
            return { kind: 'success', value: { success: true } };
        };
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/internal/reset-tenant')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
            tenantId: 'tenant-1',
            dryRun: false,
            confirmWrite: true,
        })
            .expect(200);
        assert.strictEqual(capturedDryRun, false);
    });
    (0, node_test_1.test)('POST /internal/reset-tenant/hard/token should return token payload', async () => {
        const response = await (0, supertest_1.default)(app.getHttpServer())
            .post('/internal/reset-tenant/hard/token')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
            tenantId: 'tenant-1',
        })
            .expect(200);
        assert.strictEqual(response.body.success, true);
        assert.strictEqual(response.body.data.token, 'RTH.token.secret');
        assert.strictEqual(response.body.data.expiresAt, '2026-01-01T00:00:00.000Z');
    });
    (0, node_test_1.test)('POST /internal/reset-tenant/hard should reject invalid destructiveAck', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/internal/reset-tenant/hard')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
            tenantId: 'tenant-1',
            confirmationToken: 'RTH.token.secret',
            confirmedAt: '2026-01-01T00:00:00.000Z',
            destructiveAck: 'WRONG_ACK',
            dryRun: false,
            confirmWrite: true,
        })
            .expect(400);
    });
    (0, node_test_1.test)('POST /internal/reset-tenant/hard should pass when payload is valid', async () => {
        let capturedDryRun = null;
        commandExecutorMock.executeCommand = async (_command, params) => {
            capturedDryRun = params.dryRun;
            return { kind: 'success', value: { success: true } };
        };
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/internal/reset-tenant/hard')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
            tenantId: 'tenant-1',
            confirmationToken: 'RTH.token.secret',
            confirmedAt: '2026-01-01T00:00:00.000Z',
            destructiveAck: 'HARD_RESET',
            dryRun: false,
            confirmWrite: true,
        })
            .expect(200);
        assert.strictEqual(capturedDryRun, false);
    });
    (0, node_test_1.test)('POST /internal/alert-scenario should map SAFETY_BLOCK to 403', async () => {
        commandExecutorMock.executeCommand = async () => ({
            kind: 'failure',
            error: {
                name: 'SafetyBlockedError',
                code: 'SAFETY_BLOCK',
                message: 'Execution blocked by safety gate',
                isRecoverable: false,
            },
        });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/internal/alert-scenario')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
            tenantId: 'tenant-1',
            seedBaseline: true,
            injectAnomaly: false,
            days: 30,
            dryRun: true,
        })
            .expect(403);
    });
    (0, node_test_1.test)('POST /internal/alert-scenario should map CONCURRENCY_LIMIT to 429', async () => {
        commandExecutorMock.executeCommand = async () => ({
            kind: 'failure',
            error: {
                name: 'ToolkitConcurrencyLimitError',
                code: 'CONCURRENCY_LIMIT',
                message: 'Maximum concurrent toolkit commands reached (5). Retry later.',
                isRecoverable: true,
            },
        });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/internal/alert-scenario')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
            tenantId: 'tenant-1',
            seedBaseline: true,
            injectAnomaly: false,
            days: 30,
            dryRun: true,
        })
            .expect(429);
    });
});
//# sourceMappingURL=toolkit-internal-api.e2e.test.js.map