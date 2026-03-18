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
const node_assert_1 = require("node:assert");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const manifest_pipeline_1 = require("../manifest-pipeline");
const fs_1 = require("fs");
const backendRoot = path.resolve(__dirname, '../../../..');
function spawnChild(script, timeoutMs = 15000) {
    return new Promise((resolve) => {
        const child = (0, child_process_1.spawn)('node', ['-e', script], {
            cwd: backendRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stderr = '';
        child.stderr?.on('data', (data) => { stderr += data.toString(); });
        child.on('exit', (code) => resolve({ code, stderr }));
        setTimeout(() => {
            child.kill('SIGKILL');
            resolve({ code: null, stderr: stderr + '\n[TIMEOUT]' });
        }, timeoutMs);
    });
}
(0, node_test_1.describe)('Crash: SIGINT exit code', () => {
    (0, node_test_1.it)('exits with 130 when SIGINT handler fires', async () => {
        const script = `
            require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', target: 'ES2021', esModuleInterop: true } });
            const { emergencyFinalizeAndWrite } = require('./src/toolkit/manifest/manifest-pipeline');

            process.on('SIGINT', () => {
                emergencyFinalizeAndWrite('SIGINT');
                process.exit(130);
            });

            setTimeout(() => { process.emit('SIGINT', 'SIGINT'); }, 100);
            setInterval(() => {}, 1000);
        `;
        const { code } = await spawnChild(script);
        node_assert_1.strict.strictEqual(code, 130, `Expected exit code 130, got ${code}`);
    });
});
(0, node_test_1.describe)('Crash: uncaughtException exit code', () => {
    (0, node_test_1.it)('exits with 1 when uncaughtException handler fires', async () => {
        const script = `
            require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', target: 'ES2021', esModuleInterop: true } });
            const { emergencyFinalizeAndWrite } = require('./src/toolkit/manifest/manifest-pipeline');

            process.on('uncaughtException', (err) => {
                emergencyFinalizeAndWrite('uncaughtException');
                process.exit(1);
            });

            setTimeout(() => { throw new Error('deliberate crash'); }, 50);
        `;
        const { code } = await spawnChild(script);
        node_assert_1.strict.strictEqual(code, 1, `Expected exit code 1, got ${code}`);
    });
});
(0, node_test_1.describe)('Crash: listener accumulation', () => {
    (0, node_test_1.it)('pipeline adds zero process-level listeners across 3 runs', async () => {
        const before = {
            sigint: process.listenerCount('SIGINT'),
            uncaught: process.listenerCount('uncaughtException'),
            unhandled: process.listenerCount('unhandledRejection'),
        };
        const base = path.resolve(process.cwd(), 'toolkit-manifests');
        await fs_1.promises.mkdir(base, { recursive: true });
        const tmpDir = await fs_1.promises.mkdtemp(path.join(base, 'accum-test-'));
        try {
            for (let i = 0; i < 3; i++) {
                await (0, manifest_pipeline_1.executeWithManifest)({
                    config: { executionMode: 'CLI', commandName: `test-${i}`, commandClassification: 'WRITE' },
                    execute: async () => ({ status: 'SUCCESS', exitCode: 0 }),
                    safetyOptions: { toolkitEnv: 'LOCAL', databaseUrl: 'postgresql://x@localhost/db' },
                    manifestDir: tmpDir,
                });
            }
            node_assert_1.strict.strictEqual(process.listenerCount('SIGINT'), before.sigint, 'SIGINT count unchanged');
            node_assert_1.strict.strictEqual(process.listenerCount('uncaughtException'), before.uncaught, 'uncaughtException count unchanged');
            node_assert_1.strict.strictEqual(process.listenerCount('unhandledRejection'), before.unhandled, 'unhandledRejection count unchanged');
        }
        finally {
            await fs_1.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => { });
        }
    });
});
(0, node_test_1.describe)('Crash: activeBuilder lifecycle', () => {
    (0, node_test_1.it)('no active builder after pipeline completes', () => {
        node_assert_1.strict.strictEqual((0, manifest_pipeline_1.getActiveBuilder)(), null);
    });
    (0, node_test_1.it)('emergencyFinalizeAndWrite is no-op when no active builder', () => {
        (0, manifest_pipeline_1.emergencyFinalizeAndWrite)('SIGINT');
        (0, manifest_pipeline_1.emergencyFinalizeAndWrite)('uncaughtException');
        (0, manifest_pipeline_1.emergencyFinalizeAndWrite)('unhandledRejection');
    });
});
//# sourceMappingURL=crash-handler.test.js.map