"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExecutionHistoryRecord = createExecutionHistoryRecord;
exports.createQueryOptions = createQueryOptions;
exports.isInCooldownPeriod = isInCooldownPeriod;
exports.getRemainingCooldownMs = getRemainingCooldownMs;
exports.filterByTimeWindow = filterByTimeWindow;
exports.calculateExecutionSummary = calculateExecutionSummary;
function createExecutionHistoryRecord(params) {
    const durationMs = params.finishedAt.getTime() - params.startedAt.getTime();
    return {
        ...params,
        durationMs,
    };
}
function createQueryOptions(options) {
    return {
        limit: 100,
        offset: 0,
        order: 'desc',
        ...options,
    };
}
function isInCooldownPeriod(lastExecutionAt, cooldownMs, now) {
    if (!lastExecutionAt) {
        return false;
    }
    const elapsed = now.getTime() - lastExecutionAt.getTime();
    return elapsed < cooldownMs;
}
function getRemainingCooldownMs(lastExecutionAt, cooldownMs, now) {
    const elapsed = now.getTime() - lastExecutionAt.getTime();
    return Math.max(0, cooldownMs - elapsed);
}
function filterByTimeWindow(records, windowMs, now) {
    const cutoff = new Date(now.getTime() - windowMs);
    return records.filter((r) => r.finishedAt >= cutoff);
}
function calculateExecutionSummary(records, windowStart, windowEnd) {
    const completed = records.filter((r) => r.status === 'COMPLETED');
    const failed = records.filter((r) => r.status === 'FAILED');
    const cancelled = records.filter((r) => r.status === 'CANCELLED');
    const durations = records.map((r) => r.durationMs);
    const averageDurationMs = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;
    const sorted = [...records].sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime());
    const lastExecutionAt = sorted[0]?.finishedAt;
    return {
        totalExecutions: records.length,
        completedCount: completed.length,
        failedCount: failed.length,
        cancelledCount: cancelled.length,
        lastExecutionAt,
        averageDurationMs: Math.round(averageDurationMs),
        windowStartAt: windowStart,
        windowEndAt: windowEnd,
    };
}
//# sourceMappingURL=execution-history.model.js.map