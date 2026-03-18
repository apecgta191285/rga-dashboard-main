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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const scenario_loader_1 = require("../../scenarios/scenario-loader");
const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rga-toolkit-test-'));
(0, node_test_1.describe)('ScenarioLoader (Phase 2)', () => {
    let tempDir;
    let loader;
    (0, node_test_1.beforeEach)(() => {
        tempDir = createTempDir();
        loader = new scenario_loader_1.ScenarioLoader();
        loader.setBaseDir(tempDir);
    });
    (0, node_test_1.after)(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)('should reject path traversal attempts (Test 2)', async () => {
        await assert.rejects(async () => await loader.load('../secret'), (err) => {
            assert.strictEqual(err.code, 'PATH_TRAVERSAL');
            assert.strictEqual(err.exitCode, 78);
            return true;
        });
    });
    (0, node_test_1.test)('should reject absolute paths (Test 1)', async () => {
        const absPath = process.platform === 'win32' ? 'C:\\secret' : '/etc/passwd';
        await assert.rejects(async () => await loader.load(absPath), (err) => {
            assert.strictEqual(err.code, 'PATH_TRAVERSAL');
            assert.strictEqual(err.exitCode, 78);
            return true;
        });
    });
    (0, node_test_1.test)('should reject oversized files (>64KB) (Test 7/G2b)', async () => {
        const largeFile = path.join(tempDir, 'large.yaml');
        const content = 'a'.repeat(64 * 1024 + 1);
        fs.writeFileSync(largeFile, content);
        await assert.rejects(async () => await loader.load('large'), (err) => {
            assert.strictEqual(err.code, 'FILE_TOO_LARGE');
            assert.strictEqual(err.exitCode, 78);
            return true;
        });
    });
    (0, node_test_1.test)('should reject multi-document YAML (Test 15)', async () => {
        const multiDocFile = path.join(tempDir, 'multidoc.yaml');
        const content = `
name: First
schemaVersion: 1.0.0
trend: STABLE
---
name: Second
schemaVersion: 1.0.0
trend: GROWTH
        `;
        fs.writeFileSync(multiDocFile, content);
        await assert.rejects(async () => await loader.load('multidoc'), (err) => {
            assert.strictEqual(err.code, 'MULTI_DOCUMENT_NOT_ALLOWED');
            assert.strictEqual(err.exitCode, 2);
            return true;
        });
    });
    (0, node_test_1.test)('should load valid YAML scenario (Test 4)', async () => {
        const file = path.join(tempDir, 'valid.yaml');
        const content = `
name: Valid Scenario
schemaVersion: 1.0.0
trend: GROWTH
days: 45
        `;
        fs.writeFileSync(file, content);
        const spec = await loader.load('valid');
        assert.strictEqual(spec.name, 'Valid Scenario');
        assert.strictEqual(spec.trend, 'GROWTH');
        assert.strictEqual(spec.days, 45);
        assert.strictEqual(spec.scenarioId, 'valid');
    });
    (0, node_test_1.test)('should load valid JSON scenario', async () => {
        const file = path.join(tempDir, 'jsonvalid.json');
        const content = JSON.stringify({
            name: 'JSON Scenario',
            schemaVersion: '1.0.0',
            trend: 'STABLE',
            baseImpressions: 5000
        });
        fs.writeFileSync(file, content);
        const spec = await loader.load('jsonvalid');
        assert.strictEqual(spec.name, 'JSON Scenario');
        assert.strictEqual(spec.trend, 'STABLE');
        assert.strictEqual(spec.baseImpressions, 5000);
    });
    (0, node_test_1.test)('should resolve aliases (Test 6)', async () => {
        const file = path.join(tempDir, 'realname.yaml');
        const content = `
name: Real Name
schemaVersion: 1.0.0
trend: STABLE
aliases:
  - baseline
`;
        fs.writeFileSync(file, content);
        const spec = await loader.load('baseline');
        assert.strictEqual(spec.scenarioId, 'realname');
        assert.strictEqual(spec.trend, 'STABLE');
    });
    (0, node_test_1.test)('should reject invalid validation constraints (Test 9-14)', async () => {
        const file = path.join(tempDir, 'invalid.yaml');
        fs.writeFileSync(file, 'days: 10\nschemaVersion: 1.0.0\n');
        await assert.rejects(async () => await loader.load('invalid'), (err) => {
            assert.strictEqual(err.exitCode, 2);
            return true;
        });
    });
});
//# sourceMappingURL=scenario-loader.test.js.map