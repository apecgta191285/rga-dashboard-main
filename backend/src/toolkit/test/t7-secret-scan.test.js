"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
(0, node_test_1.test)('T7: No Secrets & Stream Purity', async (t) => {
    const runnerPath = path_1.default.resolve(__dirname, 't7-runner.ts');
    const child = (0, child_process_1.spawn)('node', ['--require', 'ts-node/register/transpile-only', runnerPath], {
        env: { ...process.env, TOOLKIT_ENV: 'CI', PATH: process.env.PATH },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => stdout += d.toString());
    child.stderr.on('data', (d) => stderr += d.toString());
    await new Promise((resolve, reject) => {
        child.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Runner exited with code ${code}`));
            resolve();
        });
        child.on('error', reject);
    });
    await t.test('STDOUT Purity', () => {
        node_assert_1.default.doesNotMatch(stdout, /SUPER_SECRET_PASSWORD/);
        node_assert_1.default.doesNotMatch(stdout, /SECRET_DB_PASS/);
        node_assert_1.default.doesNotMatch(stdout, /SK-12345-SECRET/);
    });
    await t.test('STDERR Purity', () => {
        node_assert_1.default.doesNotMatch(stderr, /SUPER_SECRET_PASSWORD/);
        node_assert_1.default.doesNotMatch(stderr, /SECRET_DB_PASS/);
        node_assert_1.default.doesNotMatch(stderr, /SK-12345-SECRET/);
    });
    await t.test('Stream Routing', () => {
        node_assert_1.default.ok(stdout.includes('"msg":"User logged in"'), 'Stdout should contain JSON ops log');
        node_assert_1.default.ok(stdout.includes('"runId":"t7-test"'), 'Stdout should contain runId');
    });
});
//# sourceMappingURL=t7-secret-scan.test.js.map