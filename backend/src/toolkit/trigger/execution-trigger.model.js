"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_TRANSITIONS = exports.TERMINAL_STATUSES = exports.TRIGGER_TYPE_LABELS = void 0;
exports.isTerminalStatus = isTerminalStatus;
exports.isValidTransition = isValidTransition;
exports.generateExecutionId = generateExecutionId;
exports.createExecutionTrigger = createExecutionTrigger;
exports.createExecutionState = createExecutionState;
exports.createStartSuccess = createStartSuccess;
exports.createStartRejection = createStartRejection;
exports.transitionState = transitionState;
exports.TRIGGER_TYPE_LABELS = {
    MANUAL: 'Manual execution by user',
    PROGRAMMATIC: 'Programmatic execution via API/code',
};
exports.TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];
function isTerminalStatus(status) {
    return exports.TERMINAL_STATUSES.includes(status);
}
exports.VALID_TRANSITIONS = {
    CREATED: ['STARTED', 'CANCELLED'],
    STARTED: ['COMPLETED', 'FAILED', 'CANCELLED'],
    COMPLETED: [],
    FAILED: [],
    CANCELLED: [],
};
function isValidTransition(from, to) {
    return exports.VALID_TRANSITIONS[from].includes(to);
}
function generateExecutionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `exec-${timestamp}-${random}`;
}
function createExecutionTrigger(request) {
    return {
        executionId: generateExecutionId(),
        tenantId: request.tenantId,
        triggerType: request.triggerType,
        requestedBy: request.requestedBy,
        dryRun: request.dryRun ?? false,
        createdAt: new Date(),
        metadata: request.metadata,
    };
}
function createExecutionState(trigger) {
    return {
        executionId: trigger.executionId,
        status: 'CREATED',
        trigger,
        startedAt: null,
        completedAt: null,
    };
}
function createStartSuccess(executionId, initialStatus = 'CREATED') {
    return {
        accepted: true,
        executionId,
        status: initialStatus,
        timestamp: new Date(),
    };
}
function createStartRejection(reason, validationErrors, executionId) {
    return {
        accepted: false,
        executionId,
        status: 'CANCELLED',
        timestamp: new Date(),
        rejectionReason: reason,
        validationErrors,
    };
}
function transitionState(state, newStatus, errorMessage) {
    if (!isValidTransition(state.status, newStatus)) {
        return null;
    }
    const now = new Date();
    return {
        ...state,
        status: newStatus,
        startedAt: newStatus === 'STARTED' ? now : state.startedAt,
        completedAt: isTerminalStatus(newStatus) ? now : state.completedAt,
        errorMessage: newStatus === 'FAILED' ? errorMessage : state.errorMessage,
    };
}
//# sourceMappingURL=execution-trigger.model.js.map