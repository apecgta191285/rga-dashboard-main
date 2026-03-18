"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const execution_history_service_1 = require("../execution-history.service");
const mockLogger = {
    info: node_test_1.mock.fn(),
    warn: node_test_1.mock.fn(),
    error: node_test_1.mock.fn(),
    debug: node_test_1.mock.fn(),
};
const mockRepo = {
    record: node_test_1.mock.fn(),
    findRecentByTenant: node_test_1.mock.fn(),
    countExecutionsInWindow: node_test_1.mock.fn(),
    getMostRecent: node_test_1.mock.fn(),
    getExecutionSummary: node_test_1.mock.fn(),
};
(0, node_test_1.describe)('ExecutionHistoryService', () => {
    let service;
    (0, node_test_1.beforeEach)(() => {
        mockRepo.record.mock.resetCalls();
        mockRepo.findRecentByTenant.mock.resetCalls();
        mockRepo.countExecutionsInWindow.mock.resetCalls();
        mockRepo.getMostRecent.mock.resetCalls();
        mockRepo.getExecutionSummary.mock.resetCalls();
        mockLogger.warn.mock.resetCalls();
        service = new execution_history_service_1.ExecutionHistoryService(mockRepo, mockLogger);
    });
    const mockState = {
        executionId: 'exec-1',
        status: 'COMPLETED',
        startedAt: new Date('2023-01-01T10:00:00Z'),
        completedAt: new Date('2023-01-01T10:00:05Z'),
        trigger: {
            executionId: 'exec-1',
            tenantId: 'tenant-1',
            triggerType: 'MANUAL',
            requestedBy: 'user-1',
            createdAt: new Date('2023-01-01T10:00:00Z'),
            dryRun: false,
        },
    };
    const mockResult = {
        status: 'COMPLETED',
        runId: 'exec-1',
        context: {},
        timing: { durationMs: 5000 },
        summary: { triggeredCount: 2 },
        triggeredAlerts: [],
    };
    (0, node_test_1.it)('records execution successfully', async () => {
        mockRepo.record.mock.mockImplementation(async () => undefined);
        const record = await service.recordExecution(mockState, mockResult);
        node_assert_1.strict.strictEqual(record.executionId, 'exec-1');
        node_assert_1.strict.strictEqual(record.status, 'COMPLETED');
        node_assert_1.strict.strictEqual(mockRepo.record.mock.callCount(), 1);
    });
    (0, node_test_1.it)('handles persistence failure gracefully logPersistenceFailures=true', async () => {
        const error = new Error('DB Error');
        mockRepo.record.mock.mockImplementation(async () => { throw error; });
        const record = await service.recordExecution(mockState, mockResult);
        node_assert_1.strict.strictEqual(record.executionId, 'exec-1');
        node_assert_1.strict.strictEqual(mockLogger.warn.mock.callCount(), 1);
        const [msg, meta] = mockLogger.warn.mock.calls[0].arguments;
        node_assert_1.strict.ok(msg.includes('Failed to record execution history'));
        node_assert_1.strict.strictEqual(meta.error, 'DB Error');
    });
    (0, node_test_1.it)('findRecent delegates to repo', async () => {
        const mockHistory = [{ executionId: '1' }];
        mockRepo.findRecentByTenant.mock.mockImplementation(async () => ({ records: mockHistory, totalCount: 1 }));
        const result = await service.findRecent('tenant-1', { limit: 5 });
        node_assert_1.strict.deepStrictEqual(result.records, mockHistory);
        node_assert_1.strict.strictEqual(mockRepo.findRecentByTenant.mock.calls[0].arguments[0], 'tenant-1');
        node_assert_1.strict.strictEqual(mockRepo.findRecentByTenant.mock.calls[0].arguments[1].limit, 5);
    });
    (0, node_test_1.it)('getMostRecent returns null if no history', async () => {
        mockRepo.getMostRecent.mock.mockImplementation(async () => null);
        const result = await service.getMostRecent('tenant-1');
        node_assert_1.strict.strictEqual(result, null);
    });
    (0, node_test_1.it)('getMostRecent returns first item', async () => {
        const mockHistory = { executionId: '1', finishedAt: new Date() };
        mockRepo.getMostRecent.mock.mockImplementation(async () => mockHistory);
        const result = await service.getMostRecent('tenant-1');
        node_assert_1.strict.deepStrictEqual(result, mockHistory);
    });
    (0, node_test_1.it)('isInCooldown returns false if no previous execution', async () => {
        mockRepo.getMostRecent.mock.mockImplementation(async () => null);
        const inCooldown = await service.isInCooldown('tenant-1', 60000, new Date());
        node_assert_1.strict.strictEqual(inCooldown, false);
    });
    (0, node_test_1.it)('isInCooldown returns true if within window', async () => {
        const now = new Date('2023-01-01T12:00:00Z');
        const recent = { executionId: '1', finishedAt: new Date('2023-01-01T11:59:30Z') };
        mockRepo.getMostRecent.mock.mockImplementation(async () => recent);
        const inCooldown = await service.isInCooldown('tenant-1', 60000, now);
        node_assert_1.strict.strictEqual(inCooldown, true);
    });
    (0, node_test_1.it)('isInCooldown returns false if outside window', async () => {
        const now = new Date('2023-01-01T12:00:00Z');
        const recent = { executionId: '1', finishedAt: new Date('2023-01-01T11:58:00Z') };
        mockRepo.getMostRecent.mock.mockImplementation(async () => recent);
        const inCooldown = await service.isInCooldown('tenant-1', 60000, now);
        node_assert_1.strict.strictEqual(inCooldown, false);
    });
    (0, node_test_1.it)('getRemainingCooldown returns correct ms', async () => {
        const now = new Date('2023-01-01T12:00:00Z');
        const recent = { executionId: '1', finishedAt: new Date('2023-01-01T11:59:30Z') };
        mockRepo.getMostRecent.mock.mockImplementation(async () => recent);
        const remaining = await service.getRemainingCooldown('tenant-1', 60000, now);
        node_assert_1.strict.strictEqual(remaining, 30000);
    });
    (0, node_test_1.it)('wouldExceedRateLimit delegates to countInWindow', async () => {
        mockRepo.countExecutionsInWindow.mock.mockImplementation(async () => 5);
        const exceeded = await service.wouldExceedRateLimit('tenant-1', 5, 3600000);
        node_assert_1.strict.strictEqual(exceeded, true);
        const notExceeded = await service.wouldExceedRateLimit('tenant-1', 6, 3600000);
        node_assert_1.strict.strictEqual(notExceeded, false);
    });
});
//# sourceMappingURL=execution-history.service.test.js.map