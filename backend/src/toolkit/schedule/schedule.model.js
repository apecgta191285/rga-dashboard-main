"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEDULE_TYPE_LABELS = void 0;
exports.createScheduleDefinition = createScheduleDefinition;
exports.createSchedulePolicy = createSchedulePolicy;
exports.createEvaluationContext = createEvaluationContext;
exports.createTriggerDecision = createTriggerDecision;
exports.createBlockDecision = createBlockDecision;
exports.toTimezone = toTimezone;
exports.getStartOfDay = getStartOfDay;
exports.parseTime = parseTime;
exports.isExcludedDate = isExcludedDate;
exports.SCHEDULE_TYPE_LABELS = {
    ONCE: 'Execute once at a specific time',
    INTERVAL: 'Execute at regular intervals',
    CALENDAR: 'Execute based on calendar rules',
};
function createScheduleDefinition(params) {
    return {
        scheduleId: params.scheduleId ?? generateScheduleId(),
        tenantId: params.tenantId,
        name: params.name,
        type: params.type,
        config: params.config,
        timezone: params.timezone ?? 'UTC',
        enabled: params.enabled ?? true,
        description: params.description,
        metadata: params.metadata ?? {
            createdAt: new Date().toISOString(),
            version: 1,
        },
    };
}
function createSchedulePolicy(params) {
    return {
        maxExecutionsPerWindow: 0,
        executionWindowMs: 24 * 60 * 60 * 1000,
        skipMissed: true,
        ...params,
    };
}
function createEvaluationContext(params) {
    return {
        now: params.now ?? new Date(),
        executionHistory: params.executionHistory,
        dryRun: params.dryRun ?? false,
        correlationId: params.correlationId,
    };
}
function createTriggerDecision(context, reason, nextEligibleAt) {
    return {
        shouldTrigger: true,
        reason,
        nextEligibleAt,
        evaluatedAt: context.now,
    };
}
function createBlockDecision(context, reason, blockedBy, nextEligibleAt, details) {
    return {
        shouldTrigger: false,
        reason,
        blockedBy,
        nextEligibleAt,
        details,
        evaluatedAt: context.now,
    };
}
function generateScheduleId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sched-${timestamp}-${random}`;
}
function toTimezone(date, timezone) {
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offset = tzDate.getTime() - utcDate.getTime();
    return new Date(date.getTime() + offset);
}
function getStartOfDay(date, timezone) {
    const tzDate = toTimezone(date, timezone);
    tzDate.setHours(0, 0, 0, 0);
    return new Date(tzDate.getTime() - (tzDate.getTime() - date.getTime()));
}
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}
function isExcludedDate(date, excludedDates) {
    const dateStr = formatDateISO(date);
    return excludedDates.includes(dateStr);
}
function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}
//# sourceMappingURL=schedule.model.js.map