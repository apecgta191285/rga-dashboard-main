"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulePolicyService = void 0;
const tsyringe_1 = require("tsyringe");
const schedule_model_1 = require("./schedule.model");
let SchedulePolicyService = class SchedulePolicyService {
    evaluateSchedule(definition, policy, context) {
        if (!definition.enabled) {
            return (0, schedule_model_1.createBlockDecision)(context, 'Schedule is disabled', 'DISABLED', null);
        }
        if (policy.excludedDates && policy.excludedDates.length > 0) {
            if ((0, schedule_model_1.isExcludedDate)(context.now, policy.excludedDates)) {
                return (0, schedule_model_1.createBlockDecision)(context, `Date ${context.now.toISOString().split('T')[0]} is excluded`, 'EXCLUDED_DATE', this.calculateNextEligible(definition, policy, context));
            }
        }
        if (policy.excludedDaysOfWeek && policy.excludedDaysOfWeek.length > 0) {
            const dayOfWeek = context.now.getDay();
            if (policy.excludedDaysOfWeek.includes(dayOfWeek)) {
                return (0, schedule_model_1.createBlockDecision)(context, `Day ${dayOfWeek} is excluded`, 'EXCLUDED_DAY', this.calculateNextEligible(definition, policy, context));
            }
        }
        if (policy.allowedTimeWindows && policy.allowedTimeWindows.length > 0) {
            const windowCheck = this.checkTimeWindows(context.now, policy.allowedTimeWindows, definition.timezone);
            if (!windowCheck.inWindow) {
                return (0, schedule_model_1.createBlockDecision)(context, 'Outside allowed time windows', 'WINDOW', this.calculateNextEligible(definition, policy, context), { currentWindow: windowCheck.nextWindow });
            }
        }
        if (policy.cooldownPeriodMs &&
            policy.cooldownPeriodMs > 0 &&
            context.executionHistory.lastExecutionAt) {
            const elapsed = context.now.getTime() -
                context.executionHistory.lastExecutionAt.getTime();
            if (elapsed < policy.cooldownPeriodMs) {
                const remaining = policy.cooldownPeriodMs - elapsed;
                const nextEligible = new Date(context.executionHistory.lastExecutionAt.getTime() +
                    policy.cooldownPeriodMs);
                return (0, schedule_model_1.createBlockDecision)(context, `Cooldown period active (${Math.ceil(remaining / 1000)}s remaining)`, 'COOLDOWN', nextEligible, { cooldownRemainingMs: remaining });
            }
        }
        if (policy.maxExecutionsPerWindow &&
            policy.maxExecutionsPerWindow > 0) {
            const limit = policy.maxExecutionsPerWindow;
            const current = context.executionHistory.executionsInWindow;
            if (current >= limit) {
                return (0, schedule_model_1.createBlockDecision)(context, `Maximum executions (${limit}) reached for current window`, 'LIMIT', this.calculateNextEligible(definition, policy, context), {
                    executionsInWindow: current,
                    maxExecutions: limit,
                });
            }
        }
        const scheduleCheck = this.checkScheduleType(definition, context, policy.skipMissed ?? true);
        if (!scheduleCheck.shouldTrigger) {
            return (0, schedule_model_1.createBlockDecision)(context, scheduleCheck.reason, scheduleCheck.blockedBy ?? 'NOT_YET', scheduleCheck.nextEligibleAt);
        }
        return (0, schedule_model_1.createTriggerDecision)(context, 'All policy checks passed', this.calculateNextEligible(definition, policy, context));
    }
    calculateNextEligible(definition, policy, context) {
        switch (definition.type) {
            case 'ONCE':
                return this.calculateNextForOnce(definition, context);
            case 'INTERVAL':
                return this.calculateNextForInterval(definition, policy, context);
            case 'CALENDAR':
                return this.calculateNextForCalendar(definition, policy, context);
            default:
                return null;
        }
    }
    checkTimeWindows(now, windows, timezone) {
        const tzNow = (0, schedule_model_1.toTimezone)(now, timezone);
        const currentMinutes = tzNow.getHours() * 60 + tzNow.getMinutes();
        const currentDay = tzNow.getDay();
        for (const window of windows) {
            if (window.daysOfWeek &&
                window.daysOfWeek.length > 0 &&
                !window.daysOfWeek.includes(currentDay)) {
                continue;
            }
            const startMinutes = (0, schedule_model_1.parseTime)(window.startTime);
            const endMinutes = (0, schedule_model_1.parseTime)(window.endTime);
            if (currentMinutes >= startMinutes &&
                currentMinutes <= endMinutes) {
                return { inWindow: true };
            }
        }
        return { inWindow: false, nextWindow: this.findNextWindow(windows, tzNow) };
    }
    findNextWindow(windows, now) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const currentDay = now.getDay();
        const sortedWindows = [...windows].sort((a, b) => (0, schedule_model_1.parseTime)(a.startTime) - (0, schedule_model_1.parseTime)(b.startTime));
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const checkDay = (currentDay + dayOffset) % 7;
            for (const window of sortedWindows) {
                if (window.daysOfWeek &&
                    window.daysOfWeek.length > 0 &&
                    !window.daysOfWeek.includes(checkDay)) {
                    continue;
                }
                const startMinutes = (0, schedule_model_1.parseTime)(window.startTime);
                if (dayOffset === 0 && startMinutes <= currentMinutes) {
                    continue;
                }
                return window;
            }
        }
        return undefined;
    }
    checkScheduleType(definition, context, skipMissed) {
        switch (definition.type) {
            case 'ONCE':
                return this.checkOnceSchedule(definition, context);
            case 'INTERVAL':
                return this.checkIntervalSchedule(definition, context, skipMissed);
            case 'CALENDAR':
                return this.checkCalendarSchedule(definition, context, skipMissed);
            default:
                return {
                    shouldTrigger: false,
                    reason: 'Unknown schedule type',
                    nextEligibleAt: null,
                };
        }
    }
    checkOnceSchedule(definition, context) {
        const config = definition.config;
        const targetDate = new Date(config.targetDate);
        if (context.executionHistory.lastExecutionAt) {
            return {
                shouldTrigger: false,
                reason: 'ONCE schedule already executed',
                blockedBy: 'ALREADY_RAN',
                nextEligibleAt: null,
            };
        }
        if (context.now < targetDate) {
            return {
                shouldTrigger: false,
                reason: 'Target time not yet reached',
                blockedBy: 'NOT_YET',
                nextEligibleAt: targetDate,
            };
        }
        return {
            shouldTrigger: true,
            reason: 'Target time reached and not yet executed',
            nextEligibleAt: null,
        };
    }
    checkIntervalSchedule(definition, context, skipMissed) {
        const config = definition.config;
        const intervalMs = this.intervalToMs(config);
        if (!context.executionHistory.lastExecutionAt) {
            return {
                shouldTrigger: true,
                reason: 'First interval execution',
                nextEligibleAt: new Date(context.now.getTime() + intervalMs),
            };
        }
        const elapsed = context.now.getTime() - context.executionHistory.lastExecutionAt.getTime();
        if (elapsed >= intervalMs) {
            if (skipMissed) {
                const nextTime = new Date(context.executionHistory.lastExecutionAt.getTime() +
                    Math.ceil(elapsed / intervalMs) * intervalMs);
                return {
                    shouldTrigger: true,
                    reason: 'Interval elapsed (skipping to next aligned time)',
                    nextEligibleAt: new Date(nextTime.getTime() + intervalMs),
                };
            }
            else {
                return {
                    shouldTrigger: true,
                    reason: 'Interval elapsed',
                    nextEligibleAt: new Date(context.now.getTime() + intervalMs),
                };
            }
        }
        const remaining = intervalMs - elapsed;
        return {
            shouldTrigger: false,
            reason: `Interval not yet elapsed (${Math.ceil(remaining / 1000)}s remaining)`,
            nextEligibleAt: new Date(context.now.getTime() + remaining),
        };
    }
    checkCalendarSchedule(definition, context, skipMissed) {
        const config = definition.config;
        const tzNow = (0, schedule_model_1.toTimezone)(context.now, definition.timezone);
        if (config.dayOfWeek !== undefined &&
            tzNow.getDay() !== config.dayOfWeek) {
            return {
                shouldTrigger: false,
                reason: 'Not the scheduled day of week',
                nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
            };
        }
        if (config.dayOfMonth !== undefined &&
            tzNow.getDate() !== config.dayOfMonth) {
            return {
                shouldTrigger: false,
                reason: 'Not the scheduled day of month',
                nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
            };
        }
        if (config.hour !== undefined && tzNow.getHours() !== config.hour) {
            return {
                shouldTrigger: false,
                reason: 'Not the scheduled hour',
                nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
            };
        }
        const targetMinute = config.minute ?? 0;
        if (tzNow.getMinutes() !== targetMinute) {
            return {
                shouldTrigger: false,
                reason: 'Not the scheduled minute',
                nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
            };
        }
        if (context.executionHistory.lastExecutionAt) {
            const lastExecution = (0, schedule_model_1.toTimezone)(context.executionHistory.lastExecutionAt, definition.timezone);
            const sameHour = lastExecution.getHours() === tzNow.getHours();
            const sameDay = lastExecution.getDate() === tzNow.getDate();
            const sameMonth = lastExecution.getMonth() === tzNow.getMonth();
            const sameYear = lastExecution.getFullYear() === tzNow.getFullYear();
            if (sameHour && sameDay && sameMonth && sameYear) {
                return {
                    shouldTrigger: false,
                    reason: 'Already triggered at this scheduled time',
                    nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
                };
            }
        }
        return {
            shouldTrigger: true,
            reason: 'Calendar schedule time reached',
            nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
        };
    }
    findNextCalendarTime(config, from, timezone) {
        const next = new Date(from.getTime());
        next.setMinutes((config.minute ?? 0) + 1);
        for (let i = 0; i < 366 * 24 * 60; i++) {
            next.setMinutes(next.getMinutes() + 1);
            const tzNext = (0, schedule_model_1.toTimezone)(next, timezone);
            if (config.dayOfWeek !== undefined && tzNext.getDay() !== config.dayOfWeek) {
                continue;
            }
            if (config.dayOfMonth !== undefined && tzNext.getDate() !== config.dayOfMonth) {
                continue;
            }
            if (config.hour !== undefined && tzNext.getHours() !== config.hour) {
                continue;
            }
            if (tzNext.getMinutes() !== (config.minute ?? 0)) {
                continue;
            }
            return next;
        }
        return new Date(from.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
    intervalToMs(config) {
        if (config.minutes) {
            return config.minutes * 60 * 1000;
        }
        if (config.hours) {
            return config.hours * 60 * 60 * 1000;
        }
        if (config.days) {
            return config.days * 24 * 60 * 60 * 1000;
        }
        return 0;
    }
    calculateNextForOnce(definition, context) {
        const config = definition.config;
        const targetDate = new Date(config.targetDate);
        if (context.executionHistory.lastExecutionAt || context.now >= targetDate) {
            return null;
        }
        return targetDate;
    }
    calculateNextForInterval(definition, policy, context) {
        const config = definition.config;
        const intervalMs = this.intervalToMs(config);
        if (intervalMs === 0) {
            return null;
        }
        let baseTime;
        if (context.executionHistory.lastExecutionAt) {
            baseTime = context.executionHistory.lastExecutionAt;
        }
        else {
            baseTime = context.now;
        }
        let nextTime = new Date(baseTime.getTime() + intervalMs);
        while (nextTime <= context.now) {
            nextTime = new Date(nextTime.getTime() + intervalMs);
        }
        return nextTime;
    }
    calculateNextForCalendar(definition, _policy, context) {
        const config = definition.config;
        const tzNow = (0, schedule_model_1.toTimezone)(context.now, definition.timezone);
        return this.findNextCalendarTime(config, tzNow, definition.timezone);
    }
};
exports.SchedulePolicyService = SchedulePolicyService;
exports.SchedulePolicyService = SchedulePolicyService = __decorate([
    (0, tsyringe_1.injectable)()
], SchedulePolicyService);
//# sourceMappingURL=schedule-policy.service.js.map