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
const manifest_writer_1 = require("../manifest-writer");
const types_1 = require("../types");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const redactor_1 = require("../redactor");
function createTestManifest(overrides) {
    return {
        schemaVersion: types_1.MANIFEST_SCHEMA_VERSION,
        runId: 'test-run-id-1234',
        status: 'SUCCESS',
        exitCode: 0,
        executionMode: 'CLI',
        tty: false,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 100,
        runtime: { toolkitVersion: '0.0.0', nodeVersion: process.version, os: process.platform, pid: process.pid },
        invocation: {
            commandName: 'test-cmd',
            commandClassification: 'WRITE',
            args: {},
            flags: { dryRun: false, noDryRun: false, force: false, yes: false, verbose: false, manifestDir: null, seed: null, scenario: null },
            confirmation: { tierUsed: 'NONE', confirmationMethod: null, confirmed: false },
        },
        safety: {
            policyVersion: '1.0.0',
            gates: [],
            envSummary: { toolkitEnv: 'LOCAL', classification: 'ALLOWED' },
            dbSafetySummary: { dbHostMasked: 'localhost', dbNameMasked: 'test', classification: 'SAFE', matchedRule: null },
        },
        tenant: { tenantId: 'test-tenant', tenantSlug: null, tenantDisplayName: null, tenantResolution: 'EXPLICIT' },
        steps: [],
        results: { writesPlanned: null, writesApplied: null, externalCalls: null, filesystemWrites: null, warnings: [], errors: [] },
        ...overrides,
    };
}
(0, node_test_1.describe)('ManifestWriter.generateFilename', () => {
    (0, node_test_1.it)('follows {runId}_{command}_{timestamp}.manifest.json format', () => {
        const filename = manifest_writer_1.ManifestWriter.generateFilename('run-123', 'seed-data');
        node_assert_1.strict.ok(filename.startsWith('run-123_'));
        node_assert_1.strict.ok(filename.includes('seed-data'));
        node_assert_1.strict.ok(filename.endsWith('.manifest.json'));
    });
});
(0, node_test_1.describe)('ManifestWriter.write', () => {
    let tmpDir;
    (0, node_test_1.before)(async () => {
        const base = path.resolve(process.cwd(), 'toolkit-manifests');
        await fs_1.promises.mkdir(base, { recursive: true });
        tmpDir = await fs_1.promises.mkdtemp(path.join(base, 'writer-test-'));
    });
    (0, node_test_1.after)(async () => {
        await fs_1.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => { });
    });
    (0, node_test_1.it)('writes valid JSON manifest to disk', async () => {
        const manifest = createTestManifest();
        const writtenPath = await manifest_writer_1.ManifestWriter.write(manifest, tmpDir);
        node_assert_1.strict.ok(writtenPath !== null, 'write returned a path');
        node_assert_1.strict.ok(writtenPath.endsWith('.manifest.json'));
        const content = await fs_1.promises.readFile(writtenPath, 'utf-8');
        const parsed = JSON.parse(content);
        node_assert_1.strict.strictEqual(parsed.status, 'SUCCESS');
        node_assert_1.strict.strictEqual(parsed.runId, 'test-run-id-1234');
    });
    (0, node_test_1.it)('leaves no orphan .tmp_ files', async () => {
        const manifest = createTestManifest({ runId: 'orphan-test' });
        await manifest_writer_1.ManifestWriter.write(manifest, tmpDir);
        const files = await fs_1.promises.readdir(tmpDir);
        const tmpFiles = files.filter(f => f.startsWith('.tmp_'));
        node_assert_1.strict.strictEqual(tmpFiles.length, 0);
    });
    (0, node_test_1.it)('returns null for invalid directory (best-effort, does not throw)', async () => {
        const manifest = createTestManifest();
        const result = await manifest_writer_1.ManifestWriter.write(manifest, 'Z:\\invalid\\\0path');
        node_assert_1.strict.strictEqual(result, null);
    });
    (0, node_test_1.it)('returns null when manifest exceeds size cap', async () => {
        const oversized = createTestManifest({
            runId: 'oversized-manifest-test',
            results: {
                writesPlanned: null,
                writesApplied: null,
                externalCalls: null,
                filesystemWrites: null,
                warnings: [],
                errors: [
                    {
                        code: 'OVERSIZED_TEST',
                        message: 'x'.repeat(redactor_1.TRUNCATION_LIMITS.MAX_MANIFEST_BYTES + 1),
                        isRecoverable: false,
                    },
                ],
            },
        });
        const result = await manifest_writer_1.ManifestWriter.write(oversized, tmpDir);
        node_assert_1.strict.strictEqual(result, null);
        const files = await fs_1.promises.readdir(tmpDir);
        const oversizedFiles = files.filter((f) => f.includes('oversized-manifest-test'));
        node_assert_1.strict.strictEqual(oversizedFiles.length, 0);
    });
});
(0, node_test_1.describe)('ManifestWriter.resolveDir', () => {
    (0, node_test_1.it)('uses flag value when provided and allowlisted', () => {
        const requested = path.resolve(process.cwd(), 'toolkit-manifests', 'custom');
        const dir = manifest_writer_1.ManifestWriter.resolveDir(requested);
        node_assert_1.strict.ok(dir.length > 0);
        node_assert_1.strict.strictEqual(dir, requested);
    });
    (0, node_test_1.it)('falls back to default when flag is undefined', () => {
        const dir = manifest_writer_1.ManifestWriter.resolveDir(undefined);
        node_assert_1.strict.ok(dir.length > 0);
    });
});
//# sourceMappingURL=manifest-writer.test.js.map