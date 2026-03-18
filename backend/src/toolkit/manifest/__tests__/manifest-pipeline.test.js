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
const manifest_pipeline_1 = require("../manifest-pipeline");
const fs_1 = require("fs");
const path = __importStar(require("path"));
let tmpDir;
(0, node_test_1.before)(async () => {
    const base = path.resolve(process.cwd(), 'toolkit-manifests');
    await fs_1.promises.mkdir(base, { recursive: true });
    tmpDir = await fs_1.promises.mkdtemp(path.join(base, 'pipeline-test-'));
});
(0, node_test_1.after)(async () => {
    await fs_1.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => { });
});
(0, node_test_1.describe)('Pipeline: BLOCKED', () => {
    (0, node_test_1.it)('returns BLOCKED when TOOLKIT_ENV missing', async () => {
        const result = await (0, manifest_pipeline_1.executeWithManifest)({
            config: { executionMode: 'CLI', commandName: 'seed-data', commandClassification: 'WRITE' },
            execute: async () => ({ status: 'SUCCESS', exitCode: 0 }),
            safetyOptions: { toolkitEnv: undefined, databaseUrl: 'postgresql://x@localhost/db' },
            manifestDir: tmpDir,
        });
        node_assert_1.strict.strictEqual(result.status, 'BLOCKED');
        node_assert_1.strict.strictEqual(result.exitCode, 78);
    });
    (0, node_test_1.it)('writes BLOCKED manifest to disk', async () => {
        const files = await fs_1.promises.readdir(tmpDir);
        const manifestFiles = files.filter(f => f.endsWith('.manifest.json'));
        node_assert_1.strict.ok(manifestFiles.length >= 1, 'at least one manifest written');
        const latest = manifestFiles[manifestFiles.length - 1];
        const content = JSON.parse(await fs_1.promises.readFile(path.join(tmpDir, latest), 'utf-8'));
        node_assert_1.strict.strictEqual(content.status, 'BLOCKED');
        node_assert_1.strict.strictEqual(content.exitCode, 78);
    });
});
(0, node_test_1.describe)('Pipeline: SUCCESS', () => {
    (0, node_test_1.it)('returns SUCCESS when all gates pass and execute succeeds', async () => {
        const result = await (0, manifest_pipeline_1.executeWithManifest)({
            config: { executionMode: 'CLI', commandName: 'seed-data', commandClassification: 'WRITE' },
            execute: async () => ({ status: 'SUCCESS', exitCode: 0 }),
            safetyOptions: { toolkitEnv: 'LOCAL', databaseUrl: 'postgresql://x@localhost/db' },
            manifestDir: tmpDir,
        });
        node_assert_1.strict.strictEqual(result.status, 'SUCCESS');
        node_assert_1.strict.strictEqual(result.exitCode, 0);
    });
    (0, node_test_1.it)('has SAFETY_CHECK step', async () => {
        const files = await fs_1.promises.readdir(tmpDir);
        const manifests = files.filter(f => f.endsWith('.manifest.json')).sort();
        const latest = manifests[manifests.length - 1];
        const content = JSON.parse(await fs_1.promises.readFile(path.join(tmpDir, latest), 'utf-8'));
        const stepNames = content.steps.map((s) => s.name);
        node_assert_1.strict.ok(stepNames.includes('SAFETY_CHECK'), `Steps: ${stepNames}`);
    });
});
(0, node_test_1.describe)('Pipeline: FAILED', () => {
    (0, node_test_1.it)('returns FAILED and captures error when execute throws', async () => {
        const base = path.resolve(process.cwd(), 'toolkit-manifests');
        await fs_1.promises.mkdir(base, { recursive: true });
        const isolateDir = await fs_1.promises.mkdtemp(path.join(base, 'pipeline-fail-'));
        try {
            const result = await (0, manifest_pipeline_1.executeWithManifest)({
                config: { executionMode: 'CLI', commandName: 'test-cmd', commandClassification: 'WRITE' },
                execute: async () => { throw new Error('deliberate explosion'); },
                safetyOptions: { toolkitEnv: 'LOCAL', databaseUrl: 'postgresql://x@localhost/db' },
                manifestDir: isolateDir,
            });
            node_assert_1.strict.strictEqual(result.status, 'FAILED');
            node_assert_1.strict.strictEqual(result.exitCode, 1);
            const files = await fs_1.promises.readdir(isolateDir);
            const manifests = files.filter(f => f.endsWith('.manifest.json'));
            node_assert_1.strict.strictEqual(manifests.length, 1);
            const content = JSON.parse(await fs_1.promises.readFile(path.join(isolateDir, manifests[0]), 'utf-8'));
            node_assert_1.strict.ok(content.results.errors.length > 0, 'Should capture errors in manifest');
            node_assert_1.strict.strictEqual(content.results.errors[0].message, 'deliberate explosion');
        }
        finally {
            await fs_1.promises.rm(isolateDir, { recursive: true, force: true }).catch(() => { });
        }
    });
});
(0, node_test_1.describe)('Pipeline: redaction', () => {
    (0, node_test_1.it)('does not leak forbidden keys in manifest', async () => {
        await (0, manifest_pipeline_1.executeWithManifest)({
            config: {
                executionMode: 'CLI',
                commandName: 'seed-data',
                commandClassification: 'WRITE',
                args: { API_KEY: 'super-secret-key', tenantId: 'visible' },
            },
            execute: async () => ({ status: 'SUCCESS', exitCode: 0 }),
            safetyOptions: {
                toolkitEnv: 'LOCAL',
                databaseUrl: 'postgresql://admin:s3cret@localhost/db',
            },
            manifestDir: tmpDir,
        });
        const files = await fs_1.promises.readdir(tmpDir);
        const manifests = files.filter(f => f.endsWith('.manifest.json')).sort();
        const latest = manifests[manifests.length - 1];
        const raw = await fs_1.promises.readFile(path.join(tmpDir, latest), 'utf-8');
        node_assert_1.strict.ok(!raw.includes('super-secret-key'), 'API_KEY value not in manifest');
        node_assert_1.strict.ok(!raw.includes('s3cret'), 'DB password not in manifest');
    });
});
(0, node_test_1.describe)('Pipeline: best-effort write', () => {
    (0, node_test_1.it)('does not throw or alter exit code when manifest dir is invalid', async () => {
        const result = await (0, manifest_pipeline_1.executeWithManifest)({
            config: { executionMode: 'CLI', commandName: 'test-cmd', commandClassification: 'WRITE' },
            execute: async () => ({ status: 'SUCCESS', exitCode: 0 }),
            safetyOptions: { toolkitEnv: 'LOCAL', databaseUrl: 'postgresql://x@localhost/db' },
            manifestDir: 'Z:\\definitely\\invalid\\\0path',
        });
        node_assert_1.strict.strictEqual(result.status, 'SUCCESS');
        node_assert_1.strict.strictEqual(result.exitCode, 0);
    });
});
(0, node_test_1.describe)('evaluateSafetyGates', () => {
    (0, node_test_1.it)('passes for LOCAL + localhost', () => {
        const result = (0, manifest_pipeline_1.evaluateSafetyGates)({
            toolkitEnv: 'LOCAL',
            databaseUrl: 'postgresql://x@localhost/db',
        });
        node_assert_1.strict.ok(!result.blocked);
        node_assert_1.strict.ok(result.safety.gates.length >= 2);
        node_assert_1.strict.ok(result.safety.gates.every(g => g.passed));
    });
    (0, node_test_1.it)('blocks when TOOLKIT_ENV missing', () => {
        const result = (0, manifest_pipeline_1.evaluateSafetyGates)({
            toolkitEnv: undefined,
            databaseUrl: 'postgresql://x@localhost/db',
        });
        node_assert_1.strict.ok(result.blocked);
        node_assert_1.strict.ok(result.blockedGate !== null);
    });
    (0, node_test_1.it)('blocks for Supabase-hosted DB', () => {
        const result = (0, manifest_pipeline_1.evaluateSafetyGates)({
            toolkitEnv: 'LOCAL',
            databaseUrl: 'postgresql://x@db.abcdefghijklm.supabase.co/postgres',
        });
        node_assert_1.strict.ok(result.blocked);
    });
});
(0, node_test_1.describe)('emergencyFinalizeAndWrite', () => {
    (0, node_test_1.it)('is no-op when no active builder', () => {
        node_assert_1.strict.strictEqual((0, manifest_pipeline_1.getActiveBuilder)(), null);
        (0, manifest_pipeline_1.emergencyFinalizeAndWrite)('SIGINT');
        (0, manifest_pipeline_1.emergencyFinalizeAndWrite)('uncaughtException');
    });
});
//# sourceMappingURL=manifest-pipeline.test.js.map