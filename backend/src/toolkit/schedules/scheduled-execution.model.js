"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExecutionParams = createExecutionParams;
exports.createScheduledExecution = createScheduledExecution;
exports.validateScheduledExecution = validateScheduledExecution;
function createExecutionParams(params) {
    return {
        triggerType: params?.triggerType ?? 'PROGRAMMATIC',
        requestedBy: params?.requestedBy ?? 'scheduler',
        dryRunDefault: params?.dryRunDefault ?? false,
        metadata: params?.metadata,
    };
}
function createScheduledExecution(params) {
    return {
        id: params.id ?? generateScheduleExecutionId(),
        tenantId: params.tenantId,
        schedule: params.schedule,
        policy: params.policy,
        executionParams: params.executionParams,
        enabled: params.enabled ?? true,
    };
}
function generateScheduleExecutionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sched-exec-${timestamp}-${random}`;
}
function validateScheduledExecution(execution) {
    const errors = [];
    if (typeof execution !== 'object' || execution === null) {
        return { valid: false, errors: ['Must be an object'] };
    }
    const e = execution;
    if (!e.id || typeof e.id !== 'string') {
        errors.push('id is required and must be a string');
    }
    if (!e.tenantId || typeof e.tenantId !== 'string') {
        errors.push('tenantId is required and must be a string');
    }
    if (!e.schedule || typeof e.schedule !== 'object') {
        errors.push('schedule is required and must be an object');
    }
    if (!e.policy || typeof e.policy !== 'object') {
        errors.push('policy is required and must be an object');
    }
    if (!e.executionParams || typeof e.executionParams !== 'object') {
        errors.push('executionParams is required and must be an object');
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=scheduled-execution.model.js.map