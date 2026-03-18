"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.TZ = 'UTC';
require("reflect-metadata");
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const schedule_policy_service_1 = require("../schedule-policy.service");
const schedule_model_1 = require("../schedule.model");
const NOW = new Date('2024-01-15T09:00:00.000Z');
function emptyHistory() {
    return {
        executionsInWindow: 0,
        recentExecutions: [],
    };
}
function historyWith(lastAt, windowCount = 0, recentDates = []) {
    return {
        lastExecutionAt: lastAt,
        executionsInWindow: windowCount,
        recentExecutions: recentDates,
    };
}
function ctx(overrides = {}) {
    return (0, schedule_model_1.createEvaluationContext)({
        now: overrides.now ?? NOW,
        executionHistory: overrides.history ?? emptyHistory(),
        dryRun: overrides.dryRun ?? false,
        correlationId: overrides.correlationId,
    });
}
function calendarDef(hour, minute, opts = {}) {
    return (0, schedule_model_1.createScheduleDefinition)({
        tenantId: opts.tenantId ?? 'tenant-test',
        name: opts.name ?? 'Calendar Schedule',
        type: 'CALENDAR',
        config: { hour, minute },
        timezone: opts.timezone ?? 'UTC',
        enabled: opts.enabled ?? true,
    });
}
function intervalDef(minutes, opts = {}) {
    return (0, schedule_model_1.createScheduleDefinition)({
        tenantId: opts.tenantId ?? 'tenant-test',
        name: opts.name ?? 'Interval Schedule',
        type: 'INTERVAL',
        config: { minutes },
        timezone: opts.timezone ?? 'UTC',
        enabled: opts.enabled ?? true,
    });
}
function onceDef(targetDate, opts = {}) {
    return (0, schedule_model_1.createScheduleDefinition)({
        tenantId: opts.tenantId ?? 'tenant-test',
        name: opts.name ?? 'Once Schedule',
        type: 'ONCE',
        config: { targetDate },
        timezone: opts.timezone ?? 'UTC',
        enabled: opts.enabled ?? true,
    });
}
function defaultPolicy(overrides = {}) {
    return (0, schedule_model_1.createSchedulePolicy)(overrides);
}
const service = new schedule_policy_service_1.SchedulePolicyService();
(0, node_test_1.describe)('SchedulePolicyService — disabled schedule', () => {
    (0, node_test_1.it)('blocks with DISABLED and null nextEligible', () => {
        const def = calendarDef(9, 0, { enabled: false });
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'DISABLED');
        node_assert_1.strict.ok(decision.reason.includes('disabled'));
        node_assert_1.strict.strictEqual(decision.nextEligibleAt, null);
    });
});
(0, node_test_1.describe)('SchedulePolicyService — excluded dates', () => {
    (0, node_test_1.it)('blocks on excluded date with EXCLUDED_DATE', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ excludedDates: ['2024-01-15'] });
        const decision = service.evaluateSchedule(def, policy, ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'EXCLUDED_DATE');
        node_assert_1.strict.ok(decision.reason.includes('2024-01-15'));
    });
    (0, node_test_1.it)('allows on non-excluded date', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ excludedDates: ['2024-01-16'] });
        const decision = service.evaluateSchedule(def, policy, ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
});
(0, node_test_1.describe)('SchedulePolicyService — excluded days of week', () => {
    (0, node_test_1.it)('blocks on excluded day (Monday=1)', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ excludedDaysOfWeek: [1] });
        const decision = service.evaluateSchedule(def, policy, ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'EXCLUDED_DAY');
    });
    (0, node_test_1.it)('allows on non-excluded day', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ excludedDaysOfWeek: [0, 6] });
        const decision = service.evaluateSchedule(def, policy, ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
});
(0, node_test_1.describe)('SchedulePolicyService — time windows', () => {
    (0, node_test_1.it)('allows within time window', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{ startTime: '08:00', endTime: '17:00' }],
        });
        const decision = service.evaluateSchedule(def, policy, ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
    (0, node_test_1.it)('blocks outside time window with WINDOW', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{ startTime: '10:00', endTime: '17:00' }],
        });
        const decision = service.evaluateSchedule(def, policy, ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'WINDOW');
    });
    (0, node_test_1.it)('respects day-of-week on time windows', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{
                    startTime: '08:00',
                    endTime: '17:00',
                    daysOfWeek: [0, 6],
                }],
        });
        const decision = service.evaluateSchedule(def, policy, ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'WINDOW');
    });
});
(0, node_test_1.describe)('SchedulePolicyService — cooldown period', () => {
    (0, node_test_1.it)('blocks when still in cooldown', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ cooldownPeriodMs: 300_000 });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:58:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, policy, context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'COOLDOWN');
        node_assert_1.strict.ok(decision.details?.cooldownRemainingMs > 0);
        node_assert_1.strict.deepStrictEqual(decision.nextEligibleAt, new Date('2024-01-15T09:03:00.000Z'));
    });
    (0, node_test_1.it)('allows when cooldown has elapsed', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ cooldownPeriodMs: 300_000 });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:50:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, policy, context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
    (0, node_test_1.it)('allows when no previous execution', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ cooldownPeriodMs: 300_000 });
        const decision = service.evaluateSchedule(def, policy, ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
});
(0, node_test_1.describe)('SchedulePolicyService — rate limit', () => {
    (0, node_test_1.it)('blocks at limit with LIMIT', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ maxExecutionsPerWindow: 3 });
        const context = ctx({
            history: { executionsInWindow: 3, recentExecutions: [] },
        });
        const decision = service.evaluateSchedule(def, policy, context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'LIMIT');
        node_assert_1.strict.strictEqual(decision.details?.executionsInWindow, 3);
        node_assert_1.strict.strictEqual(decision.details?.maxExecutions, 3);
    });
    (0, node_test_1.it)('allows under limit', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ maxExecutionsPerWindow: 5 });
        const context = ctx({
            history: { executionsInWindow: 2, recentExecutions: [] },
        });
        const decision = service.evaluateSchedule(def, policy, context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
    (0, node_test_1.it)('treats maxExecutionsPerWindow=0 as unlimited', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ maxExecutionsPerWindow: 0 });
        const context = ctx({
            history: { executionsInWindow: 100, recentExecutions: [] },
        });
        const decision = service.evaluateSchedule(def, policy, context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
});
(0, node_test_1.describe)('SchedulePolicyService — ONCE schedule', () => {
    (0, node_test_1.it)('blocks with NOT_YET when target is in the future', () => {
        const def = onceDef('2024-01-16T09:00:00.000Z');
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'NOT_YET');
        node_assert_1.strict.deepStrictEqual(decision.nextEligibleAt, new Date('2024-01-16T09:00:00.000Z'));
    });
    (0, node_test_1.it)('triggers when target is exactly now', () => {
        const def = onceDef('2024-01-15T09:00:00.000Z');
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
    (0, node_test_1.it)('triggers when target is in the past', () => {
        const def = onceDef('2024-01-15T08:00:00.000Z');
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
    (0, node_test_1.it)('blocks with ALREADY_RAN when already executed', () => {
        const def = onceDef('2024-01-15T08:00:00.000Z');
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:01:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'ALREADY_RAN');
        node_assert_1.strict.strictEqual(decision.nextEligibleAt, null);
    });
});
(0, node_test_1.describe)('SchedulePolicyService — INTERVAL schedule', () => {
    (0, node_test_1.it)('triggers on first run (no history)', () => {
        const def = intervalDef(15);
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
        node_assert_1.strict.ok(decision.reason.includes('All policy checks passed'));
    });
    (0, node_test_1.it)('triggers when interval has elapsed', () => {
        const def = intervalDef(15);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:40:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
    (0, node_test_1.it)('blocks when interval has NOT elapsed', () => {
        const def = intervalDef(15);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:55:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.deepStrictEqual(decision.nextEligibleAt, new Date('2024-01-15T09:10:00.000Z'));
    });
    (0, node_test_1.it)('calculates next eligible for hours-based config', () => {
        const def = (0, schedule_model_1.createScheduleDefinition)({
            tenantId: 'tenant-test',
            name: 'Hourly',
            type: 'INTERVAL',
            config: { hours: 2 },
            timezone: 'UTC',
            enabled: true,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:00:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.deepStrictEqual(decision.nextEligibleAt, new Date('2024-01-15T10:00:00.000Z'));
    });
    (0, node_test_1.it)('handles skip-missed mode', () => {
        const def = intervalDef(15);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:15:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy({ skipMissed: true }), context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
        node_assert_1.strict.ok(decision.reason.includes('All policy checks passed'));
    });
});
(0, node_test_1.describe)('SchedulePolicyService — CALENDAR schedule', () => {
    (0, node_test_1.it)('triggers when hour and minute match', () => {
        const def = calendarDef(9, 0);
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
        node_assert_1.strict.ok(decision.reason.includes('All policy checks passed'));
    });
    (0, node_test_1.it)('blocks when hour does not match', () => {
        const def = calendarDef(10, 0);
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.ok(decision.reason.includes('hour'));
    });
    (0, node_test_1.it)('blocks when minute does not match', () => {
        const def = calendarDef(9, 30);
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.ok(decision.reason.includes('minute'));
    });
    (0, node_test_1.it)('blocks when day-of-week does not match', () => {
        const def = (0, schedule_model_1.createScheduleDefinition)({
            tenantId: 'tenant-test',
            name: 'Wednesday Only',
            type: 'CALENDAR',
            config: { dayOfWeek: 3, hour: 9, minute: 0 },
            timezone: 'UTC',
            enabled: true,
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.ok(decision.reason.includes('day of week'));
    });
    (0, node_test_1.it)('blocks when already triggered this cycle', () => {
        const def = calendarDef(9, 0);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T09:00:30.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.ok(decision.reason.includes('Already triggered'));
    });
    (0, node_test_1.it)('triggers if last execution was on a different day', () => {
        const def = calendarDef(9, 0);
        const context = ctx({
            history: historyWith(new Date('2024-01-14T09:00:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
    });
    (0, node_test_1.it)('blocks on wrong day-of-month', () => {
        const def = (0, schedule_model_1.createScheduleDefinition)({
            tenantId: 'tenant-test',
            name: 'Monthly 20th',
            type: 'CALENDAR',
            config: { dayOfMonth: 20, hour: 9, minute: 0 },
            timezone: 'UTC',
            enabled: true,
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.ok(decision.reason.includes('day of month'));
    });
});
(0, node_test_1.describe)('SchedulePolicyService — evaluation order', () => {
    (0, node_test_1.it)('disabled fires BEFORE schedule type logic', () => {
        const def = calendarDef(10, 0, { enabled: false });
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(decision.blockedBy, 'DISABLED');
    });
    (0, node_test_1.it)('excluded date fires BEFORE cooldown', () => {
        const policy = defaultPolicy({
            excludedDates: ['2024-01-15'],
            cooldownPeriodMs: 300_000,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:58:00.000Z')),
        });
        const decision = service.evaluateSchedule(calendarDef(9, 0), policy, context);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'EXCLUDED_DATE');
    });
    (0, node_test_1.it)('cooldown fires BEFORE limit', () => {
        const policy = defaultPolicy({
            cooldownPeriodMs: 300_000,
            maxExecutionsPerWindow: 1,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:59:00.000Z'), 5),
        });
        const decision = service.evaluateSchedule(calendarDef(9, 0), policy, context);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'COOLDOWN');
    });
});
(0, node_test_1.describe)('SchedulePolicyService — calculateNextEligible', () => {
    (0, node_test_1.it)('returns target date for ONCE in the future', () => {
        const def = onceDef('2024-01-20T12:00:00.000Z');
        const result = service.calculateNextEligible(def, defaultPolicy(), ctx());
        node_assert_1.strict.deepStrictEqual(result, new Date('2024-01-20T12:00:00.000Z'));
    });
    (0, node_test_1.it)('returns null for ONCE already executed', () => {
        const def = onceDef('2024-01-10T12:00:00.000Z');
        const context = ctx({
            history: historyWith(new Date('2024-01-10T12:00:00.000Z')),
        });
        const result = service.calculateNextEligible(def, defaultPolicy(), context);
        node_assert_1.strict.strictEqual(result, null);
    });
    (0, node_test_1.it)('returns future Date for INTERVAL', () => {
        const def = intervalDef(30);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:45:00.000Z')),
        });
        const result = service.calculateNextEligible(def, defaultPolicy(), context);
        node_assert_1.strict.deepStrictEqual(result, new Date('2024-01-15T09:15:00.000Z'));
    });
    (0, node_test_1.it)('returns null for interval with zero config', () => {
        const def = (0, schedule_model_1.createScheduleDefinition)({
            tenantId: 'tenant-test',
            name: 'Zero',
            type: 'INTERVAL',
            config: {},
            timezone: 'UTC',
            enabled: true,
        });
        const result = service.calculateNextEligible(def, defaultPolicy(), ctx());
        node_assert_1.strict.strictEqual(result, null);
    });
});
(0, node_test_1.describe)('SchedulePolicyService — determinism', () => {
    (0, node_test_1.it)('produces identical output across 5 runs with same input', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            cooldownPeriodMs: 300_000,
            maxExecutionsPerWindow: 5,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:50:00.000Z'), 2),
        });
        const results = [];
        for (let i = 0; i < 5; i++) {
            results.push(service.evaluateSchedule(def, policy, context));
        }
        for (let i = 1; i < results.length; i++) {
            node_assert_1.strict.strictEqual(results[i].shouldTrigger, results[0].shouldTrigger);
            node_assert_1.strict.strictEqual(results[i].blockedBy, results[0].blockedBy);
            node_assert_1.strict.strictEqual(results[i].reason, results[0].reason);
            node_assert_1.strict.deepStrictEqual(results[i].evaluatedAt, results[0].evaluatedAt);
        }
    });
});
(0, node_test_1.describe)('SchedulePolicyService — combined realistic scenario', () => {
    (0, node_test_1.it)('triggers: window ok, cooldown ok, under limit, calendar match', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{
                    startTime: '08:00',
                    endTime: '18:00',
                    daysOfWeek: [1, 2, 3, 4, 5],
                }],
            excludedDates: ['2024-01-01'],
            cooldownPeriodMs: 300_000,
            maxExecutionsPerWindow: 10,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:30:00.000Z'), 3),
        });
        const decision = service.evaluateSchedule(def, policy, context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, true);
        node_assert_1.strict.ok(decision.reason.includes('All policy checks passed'));
    });
    (0, node_test_1.it)('blocks: window ok, IN cooldown, under limit, calendar match', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{ startTime: '08:00', endTime: '18:00' }],
            cooldownPeriodMs: 300_000,
            maxExecutionsPerWindow: 10,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:58:00.000Z'), 3),
        });
        const decision = service.evaluateSchedule(def, policy, context);
        node_assert_1.strict.strictEqual(decision.shouldTrigger, false);
        node_assert_1.strict.strictEqual(decision.blockedBy, 'COOLDOWN');
    });
});
//# sourceMappingURL=schedule-policy.service.test.js.map