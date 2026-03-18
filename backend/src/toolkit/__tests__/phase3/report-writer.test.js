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
const report_writer_1 = require("../../../modules/verification/report-writer");
const manifest_builder_1 = require("../../manifest/manifest-builder");
(0, node_test_1.describe)('ReportWriter & Manifest (Phase 3)', () => {
    let writer;
    let tempDir;
    let originalAllowedReportRoots;
    (0, node_test_1.beforeEach)(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rga-verify-test-'));
        originalAllowedReportRoots = process.env.TOOLKIT_ALLOWED_REPORT_ROOTS;
        process.env.TOOLKIT_ALLOWED_REPORT_ROOTS = tempDir;
        writer = new report_writer_1.ReportWriter();
    });
    (0, node_test_1.afterEach)(() => {
        if (originalAllowedReportRoots === undefined) {
            delete process.env.TOOLKIT_ALLOWED_REPORT_ROOTS;
        }
        else {
            process.env.TOOLKIT_ALLOWED_REPORT_ROOTS = originalAllowedReportRoots;
        }
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)('T6: Should write report atomically and canonicalize JSON', async () => {
        const result = {
            meta: { runId: 'test-run-1' },
            results: [],
            summary: { b: 2, a: 1 }
        };
        const filePath = await writer.writeReport(result, tempDir);
        assert.ok(fs.existsSync(filePath), 'Report file should exist');
        const content = fs.readFileSync(filePath, 'utf8');
        assert.ok(content.includes('"a":1,"b":2'), 'JSON should be canonicalized (sorted keys)');
    });
    (0, node_test_1.test)('T6: Should prevent path traversal via runId', async () => {
        const result = { meta: { runId: '../traversal' } };
        await assert.rejects(async () => await writer.writeReport(result, tempDir), (err) => {
            assert.match(err.message, /Invalid Run ID/);
            return true;
        });
    });
    (0, node_test_1.test)('T7: Should initialize Manifest with VERIFY type equivalent and targetRunId', () => {
        const builder = new manifest_builder_1.ManifestBuilder({
            commandName: 'verify-scenario',
            commandClassification: 'READ',
            executionMode: 'CLI',
            args: { scenario: 'test', targetRunId: 'system-run-123' }
        });
        const doc = builder.finalize('SUCCESS', 0);
        assert.strictEqual(doc.invocation.commandName, 'verify-scenario');
        assert.deepStrictEqual(doc.invocation.args, { scenario: 'test', targetRunId: 'system-run-123' });
    });
});
//# sourceMappingURL=report-writer.test.js.map