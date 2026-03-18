"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const execution_trigger_service_1 = require("../execution-trigger.service");
const mockLogger = {
    info: node_test_1.mock.fn(),
    warn: node_test_1.mock.fn(),
    error: node_test_1.mock.fn(),
    debug: node_test_1.mock.fn(),
};
const mockAlertService = {
    execute: node_test_1.mock.fn(),
};
const mockHistoryService = {
    recordExecution: node_test_1.mock.fn(),
};
(0, node_test_1.describe)('ExecutionTriggerService', () => {
    let service;
    let config;
    (0, node_test_1.beforeEach)(() => {
        mockLogger.info.mock.resetCalls();
        mockLogger.warn.mock.resetCalls();
        mockLogger.error.mock.resetCalls();
        mockAlertService.execute.mock.resetCalls();
        mockHistoryService.recordExecution.mock.resetCalls();
        config = {
            maxConcurrentPerTenant: 0,
            allowDryRun: true,
        };
        service = new execution_trigger_service_1.ExecutionTriggerService(mockAlertService, mockLogger, mockHistoryService, config);
    });
    const validRequest = {
        tenantId: 'tenant-1',
        triggerType: 'MANUAL',
        requestedBy: 'user-1',
        dryRun: false,
    };
    const mockRuleProvider = {};
    const mockMetricProvider = {};
    (0, node_test_1.it)('rejects invalid request (missing tenantId)', async () => {
        const result = await service.startExecution({ ...validRequest, tenantId: '' }, mockRuleProvider, mockMetricProvider);
        node_assert_1.strict.strictEqual(result.accepted, false);
        node_assert_1.strict.ok(result.rejectionReason?.includes('Validation failed'));
        node_assert_1.strict.ok(mockLogger.warn);
    });
    (0, node_test_1.it)('rejects dry run if config disallows it', async () => {
        const strictConfig = { ...config, allowDryRun: false };
        const strictService = new execution_trigger_service_1.ExecutionTriggerService(mockAlertService, mockLogger, mockHistoryService, strictConfig);
        const result = await strictService.startExecution({ ...validRequest, dryRun: true }, mockRuleProvider, mockMetricProvider);
        node_assert_1.strict.strictEqual(result.accepted, false);
        node_assert_1.strict.ok(result.rejectionReason?.includes('Validation failed'));
    });
    (0, node_test_1.it)('enforces concurrency limit', async () => {
        const limitedConfig = { ...config, maxConcurrentPerTenant: 1 };
        const limitedService = new execution_trigger_service_1.ExecutionTriggerService(mockAlertService, mockLogger, mockHistoryService, limitedConfig);
        let releaseExecution;
        mockAlertService.execute.mock.mockImplementation(() => new Promise((resolve) => {
            releaseExecution = resolve;
        }));
        const p1 = limitedService.startExecution(validRequest, mockRuleProvider, mockMetricProvider);
        await new Promise(resolve => setTimeout(resolve, 0));
        const result2 = await limitedService.startExecution(validRequest, mockRuleProvider, mockMetricProvider);
        node_assert_1.strict.strictEqual(result2.accepted, false);
        node_assert_1.strict.ok(result2.rejectionReason?.includes('Maximum concurrent executions'));
        if (releaseExecution) {
            releaseExecution({ status: 'COMPLETED', summary: { triggeredCount: 0 } });
        }
        const result1 = await p1;
        node_assert_1.strict.strictEqual(result1.accepted, true);
    });
    (0, node_test_1.it)('successfully starts and completes execution', async () => {
        const mockResult = {
            status: 'COMPLETED',
            summary: { triggeredCount: 5 },
        };
        mockAlertService.execute.mock.mockImplementation(async () => mockResult);
        const result = await service.startExecution(validRequest, mockRuleProvider, mockMetricProvider);
        node_assert_1.strict.strictEqual(result.accepted, true);
        node_assert_1.strict.ok(result.executionId);
        node_assert_1.strict.strictEqual(mockAlertService.execute.mock.callCount(), 1);
        await new Promise(resolve => process.nextTick(resolve));
        node_assert_1.strict.strictEqual(mockHistoryService.recordExecution.mock.callCount(), 1);
        const state = service.getExecutionState(result.executionId);
        node_assert_1.strict.strictEqual(state?.status, 'COMPLETED');
    });
    (0, node_test_1.it)('handles implementation failure gracefully', async () => {
        const error = new Error('Execution boom');
        mockAlertService.execute.mock.mockImplementation(async () => { throw error; });
        const result = await service.startExecution(validRequest, mockRuleProvider, mockMetricProvider);
        node_assert_1.strict.strictEqual(result.accepted, false);
        node_assert_1.strict.strictEqual(result.rejectionReason, 'Execution boom');
        await new Promise(resolve => process.nextTick(resolve));
        node_assert_1.strict.strictEqual(mockHistoryService.recordExecution.mock.callCount(), 1);
        const [recordedState, recordedResult] = mockHistoryService.recordExecution.mock.calls[0].arguments;
        node_assert_1.strict.strictEqual(recordedState.status, 'FAILED');
        node_assert_1.strict.strictEqual(recordedResult.status, 'FAILED');
    });
    (0, node_test_1.it)('cancels active execution', async () => {
        mockAlertService.execute.mock.mockImplementation(() => new Promise(() => { }));
        const result = await service.startExecution(validRequest, mockRuleProvider, mockMetricProvider);
        node_assert_1.strict.strictEqual(result.accepted, true);
        const cancelled = service.cancelExecution(result.executionId, 'User abort', 'admin');
        node_assert_1.strict.strictEqual(cancelled, true);
        const state = service.getExecutionState(result.executionId);
        node_assert_1.strict.strictEqual(state?.status, 'CANCELLED');
    });
    (0, node_test_1.it)('cannot cancel terminal execution', async () => {
        mockAlertService.execute.mock.mockImplementation(async () => ({ status: 'COMPLETED', summary: {} }));
        const result = await service.startExecution(validRequest, mockRuleProvider, mockMetricProvider);
        const cancelled = service.cancelExecution(result.executionId, 'User abort', 'admin');
        node_assert_1.strict.strictEqual(cancelled, false);
    });
    (0, node_test_1.it)('cleans up terminal executions', async () => {
        mockAlertService.execute.mock.mockImplementationOnce(() => new Promise(() => { }));
        const activeRun = await service.startExecution(validRequest, mockRuleProvider, mockMetricProvider);
        mockAlertService.execute.mock.mockImplementationOnce(async () => ({ status: 'COMPLETED', summary: {} }));
        const completedRun = await service.startExecution(validRequest, mockRuleProvider, mockMetricProvider);
        await new Promise(resolve => setTimeout(resolve, 10));
        const completedState = service.getExecutionState(completedRun.executionId);
        if (completedState) {
        }
        const now = new Date();
        const future = new Date(now.getTime() + 10000000);
        const cleanedCount = service.cleanupTerminalExecutions(0, future);
        node_assert_1.strict.strictEqual(cleanedCount, 1);
        node_assert_1.strict.strictEqual(service.getExecutionState(completedRun.executionId), null);
        node_assert_1.strict.ok(service.getExecutionState(activeRun.executionId));
    });
});
//# sourceMappingURL=execution-trigger.service.test.js.map