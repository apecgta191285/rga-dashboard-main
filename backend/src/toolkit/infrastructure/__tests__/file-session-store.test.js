"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const file_session_store_1 = require("../file-session-store");
class MockFileSystem {
    constructor() {
        this.exists = node_test_1.mock.fn();
        this.readFile = node_test_1.mock.fn();
        this.writeFile = node_test_1.mock.fn();
        this.mkdir = node_test_1.mock.fn();
        this.rename = node_test_1.mock.fn();
        this.rm = node_test_1.mock.fn();
    }
}
(0, node_test_1.describe)('FileSessionStore', () => {
    let store;
    let mockFs;
    (0, node_test_1.beforeEach)(() => {
        mockFs = new MockFileSystem();
        mockFs.exists.mock.mockImplementation(() => false);
        store = new file_session_store_1.FileSessionStore(mockFs);
    });
    (0, node_test_1.it)('initializes and creates directory if missing', async () => {
        mockFs.exists.mock.mockImplementation(() => false);
        await store.getLastTenantId();
        node_assert_1.strict.ok(mockFs.exists.mock.callCount() >= 1);
        node_assert_1.strict.strictEqual(mockFs.mkdir.mock.callCount(), 1);
    });
    (0, node_test_1.it)('loads existing data', async () => {
        const storedData = {
            version: 1,
            lastTenantId: 'tenant-1',
            cache: {},
            history: [],
        };
        mockFs.exists.mock.mockImplementation(() => true);
        mockFs.readFile.mock.mockImplementation(async () => JSON.stringify(storedData));
        const tenantId = await store.getLastTenantId();
        node_assert_1.strict.deepStrictEqual(tenantId, 'tenant-1');
        node_assert_1.strict.strictEqual(mockFs.readFile.mock.callCount(), 1);
    });
    (0, node_test_1.it)('saves data on setLastTenantId', async () => {
        await store.setLastTenantId('tenant-2');
        node_assert_1.strict.strictEqual(mockFs.writeFile.mock.callCount(), 1);
        const [path, content] = mockFs.writeFile.mock.calls[0].arguments;
        node_assert_1.strict.ok(path.endsWith('.tmp'));
        node_assert_1.strict.ok(content.includes('tenant-2'));
        node_assert_1.strict.strictEqual(mockFs.rename.mock.callCount(), 1);
    });
    (0, node_test_1.it)('respects cache expiration', async () => {
        const now = Date.now();
        const storedData = {
            version: 1,
            lastTenantId: null,
            cache: {
                'valid': { value: 'v1', expiresAt: new Date(now + 10000).toISOString() },
                'expired': { value: 'v2', expiresAt: new Date(now - 10000).toISOString() },
            },
            history: [],
        };
        mockFs.exists.mock.mockImplementation(() => true);
        mockFs.readFile.mock.mockImplementation(async () => JSON.stringify(storedData));
        const valid = await store.getCache('valid');
        node_assert_1.strict.strictEqual(valid, 'v1');
        const expired = await store.getCache('expired');
        node_assert_1.strict.strictEqual(expired, null);
        node_assert_1.strict.strictEqual(mockFs.writeFile.mock.callCount(), 1);
    });
    (0, node_test_1.it)('limits history size to 100', async () => {
        const history = Array(100).fill(null).map((_, i) => ({ command: `cmd${i}` }));
        const storedData = { version: 1, lastTenantId: null, cache: {}, history };
        mockFs.exists.mock.mockImplementation(() => true);
        mockFs.readFile.mock.mockImplementation(async () => JSON.stringify(storedData));
        await store.addToHistory({ command: 'new', timestamp: new Date(), success: true, durationMs: 10 });
        const saveCall = mockFs.writeFile.mock.calls[0];
        const savedData = JSON.parse(saveCall.arguments[1]);
        node_assert_1.strict.strictEqual(savedData.history.length, 100);
        node_assert_1.strict.strictEqual(savedData.history[0].command, 'new');
        node_assert_1.strict.strictEqual(savedData.history[99].command, 'cmd98');
    });
});
//# sourceMappingURL=file-session-store.test.js.map