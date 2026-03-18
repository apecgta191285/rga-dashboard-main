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
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const node_stream_1 = require("node:stream");
const ops_logger_1 = require("../core/observability/ops-logger");
const ui_printer_1 = require("../core/observability/ui-printer");
const Redactor = __importStar(require("../manifest/redactor"));
const crypto_1 = require("crypto");
function createCaptureStream() {
    const stream = new node_stream_1.PassThrough();
    const chunks = [];
    stream.on('data', (c) => chunks.push(c.toString()));
    return {
        stream,
        getOutput: () => chunks.join(''),
        clear: () => chunks.length = 0
    };
}
(0, node_test_1.describe)('Phase 4B Observability', () => {
    (0, node_test_1.test)('T1: Context Binding (pino child)', () => {
        const logger = new ops_logger_1.PinoOpsLogger('LOCAL');
        const child = logger.child({ runId: 'test-run', custom: 'value' });
        node_assert_1.default.ok(child.info);
        node_assert_1.default.ok(child.child);
    });
    (0, node_test_1.test)('T2: Redaction (Meta Object)', () => {
        const args = { password: 'secret123', email: 'ok@ok.com' };
        const redacted = Redactor.redactArgs(args);
        node_assert_1.default.strictEqual(redacted.password, '[REDACTED]');
        node_assert_1.default.strictEqual(redacted.email, 'ok@ok.com');
    });
    (0, node_test_1.test)('T3: Redaction (Error Object)', () => {
        const err = new Error('Connect to postgres://user:pass@host:5432/db');
        const sanitized = Redactor.sanitizeError(err);
        node_assert_1.default.match(sanitized.message, /postgres:\/\/\*\*\*:\*\*\*@host(:5432)?\/db/);
        node_assert_1.default.doesNotMatch(sanitized.message, /pass/);
    });
    (0, node_test_1.test)('T4: UI Printer Routing', () => {
        const printerCI = new ui_printer_1.ConsoleUiPrinter('CI');
        const printerLocal = new ui_printer_1.ConsoleUiPrinter('LOCAL');
        node_assert_1.default.ok(printerCI);
        node_assert_1.default.ok(printerLocal);
    });
    (0, node_test_1.test)('T5: Env Config', () => {
        const logger = new ops_logger_1.PinoOpsLogger('CI');
        node_assert_1.default.ok(logger);
    });
    (0, node_test_1.test)('T6: RunId Generation', () => {
        const id1 = (0, crypto_1.randomUUID)();
        const id2 = (0, crypto_1.randomUUID)();
        node_assert_1.default.notStrictEqual(id1, id2);
    });
});
//# sourceMappingURL=observability.test.js.map