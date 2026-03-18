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
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const safety_execution_1 = require("../../core/safety-execution");
const contracts_1 = require("../../core/contracts");
const client_1 = require("@prisma/client");
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
function buildContext(dryRun = false) {
    return {
        tenantId: (0, contracts_1.createTenantId)('11111111-1111-1111-1111-111111111111'),
        correlationId: 'corr-test',
        startedAt: new Date(),
        dryRun,
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
}
(0, node_test_1.describe)('executeWithSafetyManifest', () => {
    let oldEnv;
    let prisma;
    (0, node_test_1.beforeEach)(() => {
        oldEnv = { ...process.env };
        prisma = new client_1.PrismaClient();
    });
    (0, node_test_1.afterEach)(async () => {
        process.env = oldEnv;
        await prisma.$disconnect();
    });
    (0, node_test_1.test)('blocks unsafe host before handler execution', async () => {
        process.env.TOOLKIT_ENV = 'DEV';
        process.env.DATABASE_URL = 'postgresql://x@db.abcdefghijklm.supabase.co/postgres';
        process.env.TOOLKIT_SAFE_DB_HOSTS = 'localhost,127.0.0.1';
        let executed = false;
        const { result, pipeline } = await (0, safety_execution_1.executeWithSafetyManifest)({
            commandName: 'reset-tenant',
            executionMode: 'CLI',
            context: buildContext(false),
            prisma,
            skipSchemaParityPreflight: true,
            execute: async () => {
                executed = true;
                return contracts_1.Result.success({ ok: true });
            },
        });
        assert.strictEqual(executed, false);
        assert.strictEqual(result.kind, 'failure');
        assert.strictEqual(pipeline?.status, 'BLOCKED');
    });
    (0, node_test_1.test)('executes handler when host is allowlisted', async () => {
        process.env.TOOLKIT_ENV = 'DEV';
        process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/rga_dev';
        process.env.TOOLKIT_SAFE_DB_HOSTS = 'localhost,127.0.0.1';
        let executed = false;
        const { result, pipeline } = await (0, safety_execution_1.executeWithSafetyManifest)({
            commandName: 'seed-google-ads',
            executionMode: 'CLI',
            context: buildContext(true),
            prisma,
            skipSchemaParityPreflight: true,
            execute: async () => {
                executed = true;
                return contracts_1.Result.success({ ok: true });
            },
        });
        assert.strictEqual(executed, true);
        assert.strictEqual(result.kind, 'success');
        assert.strictEqual(pipeline?.status, 'SUCCESS');
    });
    (0, node_test_1.test)('blocks execution when schema parity preflight fails', async () => {
        process.env.TOOLKIT_ENV = 'DEV';
        process.env.DATABASE_URL =
            'postgresql://postgres:password@localhost:5432/rga_dev?schema=invalid-schema!';
        process.env.TOOLKIT_SAFE_DB_HOSTS = 'localhost,127.0.0.1';
        let executed = false;
        const { result, pipeline } = await (0, safety_execution_1.executeWithSafetyManifest)({
            commandName: 'seed-google-ads',
            executionMode: 'CLI',
            context: buildContext(true),
            prisma,
            execute: async () => {
                executed = true;
                return contracts_1.Result.success({ ok: true });
            },
        });
        assert.strictEqual(executed, false);
        assert.strictEqual(result.kind, 'failure');
        assert.strictEqual(result.error.code, 'SCHEMA_PARITY_VIOLATION');
        assert.strictEqual(pipeline?.status, 'BLOCKED');
    });
});
//# sourceMappingURL=safety-execution.test.js.map