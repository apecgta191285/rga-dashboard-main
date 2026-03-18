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
const crypto = __importStar(require("crypto"));
const fixture_provider_1 = require("../../fixtures/fixture-provider");
const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rga-toolkit-exec-test-'));
(0, node_test_1.describe)('FixtureProvider (Phase 2)', () => {
    let tempDir;
    let provider;
    (0, node_test_1.beforeEach)(() => {
        tempDir = createTempDir();
        provider = new fixture_provider_1.FixtureProvider({ baseDir: tempDir });
    });
    (0, node_test_1.after)(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)('should reject path traversal attempts (Test 17)', async () => {
        await assert.rejects(async () => await provider.loadFixture('../secret', 123), (err) => {
            assert.strictEqual(err.code, 'PATH_TRAVERSAL');
            assert.strictEqual(err.exitCode, 78);
            return true;
        });
    });
    (0, node_test_1.test)('should reject oversized files (>256KB) (Test 18)', async () => {
        const scenarioId = 'oversized';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const largeFile = path.join(tempDir, filename);
        const content = 'a'.repeat(256 * 1024 + 1);
        fs.writeFileSync(largeFile, content);
        await assert.rejects(async () => await provider.loadFixture(scenarioId, seed), (err) => {
            assert.strictEqual(err.code, 'FIXTURE_TOO_LARGE');
            assert.strictEqual(err.exitCode, 78);
            return true;
        });
    });
    (0, node_test_1.test)('should load valid golden fixture and verify checksum (Test 16, 19)', async () => {
        const scenarioId = 'valid';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const file = path.join(tempDir, filename);
        const shape = {
            totalCampaigns: 1,
            totalMetricRows: 5,
            perPlatform: {
                google: { campaigns: 1, metricRows: 5 }
            }
        };
        const canonical = '{"perPlatform":{"google":{"campaigns":1,"metricRows":5}},"totalCampaigns":1,"totalMetricRows":5}';
        const hash = crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
        const checksum = `sha256:${hash}`;
        const fixtureContent = JSON.stringify({
            schemaVersion: '1.0.0',
            scenarioId: 'valid',
            checksum,
            shape,
            samples: []
        });
        fs.writeFileSync(file, fixtureContent);
        const fixture = await provider.loadFixture(scenarioId, seed);
        assert.deepStrictEqual(fixture.shape, shape);
        assert.strictEqual(fixture.checksum, checksum);
    });
    (0, node_test_1.test)('should reject fixture with mismatched checksum (Test 19 Fail)', async () => {
        const scenarioId = 'badhash';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const file = path.join(tempDir, filename);
        const shape = { totalMetricRows: 1 };
        const fixtureContent = JSON.stringify({
            schemaVersion: '1.0.0',
            scenarioId: 'badhash',
            checksum: 'sha256:0000000000',
            shape,
            samples: []
        });
        fs.writeFileSync(file, fixtureContent);
        await assert.rejects(async () => await provider.loadFixture(scenarioId, seed), (err) => {
            assert.strictEqual(err.code, 'CHECKSUM_MISMATCH');
            assert.strictEqual(err.exitCode, 2);
            return true;
        });
    });
    (0, node_test_1.test)('should canonicalize key order for checksum verification (Test 19 Canonical)', async () => {
        const scenarioId = 'order';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const file = path.join(tempDir, filename);
        const canonical = '{"a":1,"b":2}';
        const hash = crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
        const checksum = `sha256:${hash}`;
        const fixtureContent = '{"schemaVersion":"1.0.0","scenarioId":"order","checksum":"' + checksum + '","shape":{"b":2,"a":1},"samples":[]}';
        fs.writeFileSync(file, fixtureContent);
        const fixture = await provider.loadFixture(scenarioId, seed);
        assert.strictEqual(fixture.scenarioId, 'order');
    });
    (0, node_test_1.test)('should reject invalid JSON structure (Test 20)', async () => {
        const scenarioId = 'invalid';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const file = path.join(tempDir, filename);
        fs.writeFileSync(file, '{ invalid json ');
        await assert.rejects(async () => await provider.loadFixture(scenarioId, seed), (err) => {
            assert.strictEqual(err.code, 'PARSE_ERROR');
            assert.strictEqual(err.exitCode, 2);
            return true;
        });
    });
});
//# sourceMappingURL=fixture-provider.test.js.map