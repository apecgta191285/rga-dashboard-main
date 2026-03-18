"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const backend_api_client_1 = require("../backend-api.client");
(0, node_test_1.describe)('BackendApiClient', () => {
    let client;
    const originalFetch = global.fetch;
    const mockFetch = node_test_1.mock.fn();
    (0, node_test_1.beforeEach)(() => {
        global.fetch = mockFetch;
        process.env.API_BASE_URL = 'http://test-api.local';
        client = new backend_api_client_1.BackendApiClient();
        mockFetch.mock.resetCalls();
    });
    (0, node_test_1.afterEach)(() => {
        global.fetch = originalFetch;
    });
    (0, node_test_1.it)('triggerAlertCheck sends correct request', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ success: true, alertsCreated: 5 }),
        };
        mockFetch.mock.mockImplementation(async () => mockResponse);
        const result = await client.triggerAlertCheck('token-123', 'tenant-1');
        node_assert_1.strict.strictEqual(result.success, true);
        node_assert_1.strict.strictEqual(result.alertsCreated, 5);
        node_assert_1.strict.strictEqual(mockFetch.mock.callCount(), 1);
        const [url, options] = mockFetch.mock.calls[0].arguments;
        node_assert_1.strict.strictEqual(url, 'http://test-api.local/api/v1/alerts/trigger-check');
        node_assert_1.strict.strictEqual(options.method, 'POST');
        node_assert_1.strict.strictEqual(options.headers['Authorization'], 'Bearer token-123');
        node_assert_1.strict.strictEqual(options.headers['x-tenant-id'], 'tenant-1');
        node_assert_1.strict.strictEqual(JSON.parse(options.body).timeframe, 'YESTERDAY');
    });
    (0, node_test_1.it)('triggerAlertCheck parses error response correctly', async () => {
        const mockResponse = {
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: async () => JSON.stringify({ message: 'Invalid timeframe' }),
        };
        mockFetch.mock.mockImplementation(async () => mockResponse);
        await node_assert_1.strict.rejects(async () => {
            await client.triggerAlertCheck('token', 'tenant');
        }, /API request failed: 400 Bad Request - Invalid timeframe/);
    });
    (0, node_test_1.it)('triggerAlertCheck handles non-JSON error response', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server crashed',
        };
        mockFetch.mock.mockImplementation(async () => mockResponse);
        await node_assert_1.strict.rejects(async () => {
            await client.triggerAlertCheck('token', 'tenant');
        }, /API request failed: 500 Internal Server Error - Server crashed/);
    });
    (0, node_test_1.it)('healthCheck returns true on 200 OK', async () => {
        mockFetch.mock.mockImplementation(async () => ({ ok: true }));
        const healthy = await client.healthCheck();
        node_assert_1.strict.strictEqual(healthy, true);
    });
    (0, node_test_1.it)('healthCheck returns false on error', async () => {
        mockFetch.mock.mockImplementation(async () => ({ ok: false }));
        const healthy = await client.healthCheck();
        node_assert_1.strict.strictEqual(healthy, false);
    });
    (0, node_test_1.it)('healthCheck returns false on exception', async () => {
        mockFetch.mock.mockImplementation(async () => { throw new Error('Network error'); });
        const healthy = await client.healthCheck();
        node_assert_1.strict.strictEqual(healthy, false);
    });
});
//# sourceMappingURL=backend-api.client.test.js.map