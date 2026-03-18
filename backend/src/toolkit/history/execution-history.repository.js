"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryQueryError = exports.HistoryPersistenceError = exports.SystemClock = void 0;
exports.SystemClock = {
    now: () => new Date(),
};
class HistoryPersistenceError extends Error {
    constructor(message, executionId, cause) {
        super(message);
        this.executionId = executionId;
        this.cause = cause;
        this.name = 'HistoryPersistenceError';
    }
}
exports.HistoryPersistenceError = HistoryPersistenceError;
class HistoryQueryError extends Error {
    constructor(message, invalidParams) {
        super(message);
        this.invalidParams = invalidParams;
        this.name = 'HistoryQueryError';
    }
}
exports.HistoryQueryError = HistoryQueryError;
//# sourceMappingURL=execution-history.repository.js.map