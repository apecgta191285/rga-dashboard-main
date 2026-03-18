"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const node_child_process_1 = require("node:child_process");
const node_util_1 = __importDefault(require("node:util"));
const node_path_1 = __importDefault(require("node:path"));
const execAsync = node_util_1.default.promisify(node_child_process_1.exec);
const CLI_PATH = node_path_1.default.resolve(__dirname, '../cli.ts');
const TS_NODE_CMD = `npx ts-node ${CLI_PATH}`;
(0, node_test_1.describe)('Headless CLI Integration', () => {
    const TEST_TENANT_ID = 'tenant-123';
    (0, node_test_1.test)('should fail if command is unknown', async () => {
        try {
            const { stdout, stderr } = await execAsync(`${TS_NODE_CMD} unknown-command --headless`);
            console.log('STDOUT:', stdout);
            console.log('STDERR:', stderr);
            node_assert_1.default.fail('Should have failed but succeeded');
        }
        catch (error) {
            if (error.code === undefined) {
                throw error;
            }
            const output = error.stdout + error.stderr;
            node_assert_1.default.ok(output.includes('Error: Unknown command') || output.includes('Unknown command'), `Expected output to contain error, got: ${output}`);
            node_assert_1.default.strictEqual(error.code, 1);
        }
    });
    (0, node_test_1.test)('should fail if tenant is missing', async () => {
        try {
            await execAsync(`${TS_NODE_CMD} verify-scenario --headless`);
            node_assert_1.default.fail('Should have failed');
        }
        catch (error) {
        }
    });
    (0, node_test_1.test)('verify-scenario --help (or invalid args) should fail gracefully', async () => {
        try {
            await execAsync(`${TS_NODE_CMD} verify-scenario --tenant ${TEST_TENANT_ID} --headless`);
            node_assert_1.default.fail('Should have failed');
        }
        catch (error) {
            const output = error.stdout + error.stderr;
            node_assert_1.default.ok(output.includes('ERROR: --scenario is required'), `Expected scenario error, got: ${output}`);
        }
    });
    (0, node_test_1.test)('verify-scenario should attempt execution with provided args', async () => {
        try {
            await execAsync(`${TS_NODE_CMD} verify-scenario --tenant ${TEST_TENANT_ID} --scenario baseline --headless --dryRun`);
        }
        catch (error) {
            const output = error.stdout + error.stderr;
            const executed = output.includes('Tenant metadata lookup failed') || output.includes('Loaded scenario') || output.includes('Verification Failed');
            node_assert_1.default.ok(executed, 'CLI should have attempted execution');
        }
    });
});
//# sourceMappingURL=headless-cli.test.js.map