"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerRunner = void 0;
const tsyringe_1 = require("tsyringe");
const core_1 = require("../core");
const scheduler_runner_model_1 = require("./scheduler-runner.model");
let SchedulerRunner = class SchedulerRunner {
    constructor(deps, logger) {
        this.deps = deps;
        this.logger = logger?.child({ source: 'SchedulerRunner' }) ?? console;
    }
    async tickTenant(tenantId, now, options) {
        const opts = (0, scheduler_runner_model_1.createTickOptions)(options);
        this.logger.info('Starting scheduler tick', {
            tenantId,
            now: now.toISOString(),
            dryRun: opts.dryRun,
        });
        try {
            const schedules = await this.loadSchedules(tenantId);
            const decisions = [];
            const triggerCandidates = [];
            for (const scheduledExecution of schedules) {
                const decision = await this.evaluateSchedule(scheduledExecution, tenantId, now, opts.dryRun);
                if (opts.includeDecisions) {
                    decisions.push(decision);
                }
                if (decision.shouldTrigger) {
                    if (triggerCandidates.length < opts.maxTriggers) {
                        triggerCandidates.push((0, scheduler_runner_model_1.createTriggerCandidate)({
                            scheduleId: scheduledExecution.id,
                            tenantId,
                            executionParams: scheduledExecution.executionParams,
                        }));
                    }
                    else {
                        this.logger.warn('Max triggers limit reached, skipping additional candidates', {
                            scheduleId: scheduledExecution.id,
                            tenantId,
                            maxTriggers: opts.maxTriggers,
                        });
                    }
                }
            }
            const result = (0, scheduler_runner_model_1.createTickResult)({
                tenantId,
                now,
                dryRun: opts.dryRun,
                evaluatedCount: schedules.length,
                decisions,
                triggerCandidates,
            });
            this.logger.info('Scheduler tick completed', {
                tenantId,
                evaluatedCount: result.evaluatedCount,
                triggeredCount: result.triggeredCount,
            });
            return result;
        }
        catch (error) {
            this.logger.error('Scheduler tick failed', error instanceof Error ? error : new Error(String(error)), { tenantId });
            return (0, scheduler_runner_model_1.createTickResult)({
                tenantId,
                now,
                dryRun: opts.dryRun,
                evaluatedCount: 0,
                decisions: [],
                triggerCandidates: [],
            });
        }
    }
    async loadSchedules(tenantId) {
        const allSchedules = await this.deps.scheduleProvider.getSchedulesForTenant(tenantId);
        const enabledSchedules = allSchedules.filter((s) => s.enabled);
        this.logger.debug('Loaded schedules for tenant', {
            tenantId,
            total: allSchedules.length,
            enabled: enabledSchedules.length,
        });
        return enabledSchedules;
    }
    async buildHistorySummary(tenantId, policy, now) {
        try {
            const windowMs = policy.executionWindowMs ?? 24 * 60 * 60 * 1000;
            const summary = await this.deps.executionHistoryService.getSummary(tenantId, windowMs, now);
            const mostRecent = await this.deps.executionHistoryService.getMostRecent(tenantId);
            return {
                executionsInWindow: summary.totalExecutions,
                lastExecutionAt: summary.lastExecutionAt,
                windowStartAt: summary.windowStartAt,
                recentExecutions: summary.lastExecutionAt ? [summary.lastExecutionAt] : [],
            };
        }
        catch (error) {
            this.logger.warn('Failed to query execution history, using neutral defaults', {
                tenantId,
                error: error.message,
            });
            return {
                executionsInWindow: 0,
                recentExecutions: [],
            };
        }
    }
    async evaluateSchedule(scheduledExecution, tenantId, now, dryRun) {
        try {
            const historySummary = await this.buildHistorySummary(tenantId, scheduledExecution.policy, now);
            const context = {
                now,
                executionHistory: historySummary,
                dryRun,
            };
            const decision = this.deps.schedulePolicyService.evaluateSchedule(scheduledExecution.schedule, scheduledExecution.policy, context);
            return (0, scheduler_runner_model_1.createRunnerScheduleDecision)({
                scheduleId: scheduledExecution.id,
                shouldTrigger: decision.shouldTrigger,
                reason: decision.reason,
                blockedBy: decision.blockedBy,
                nextEligibleAt: decision.nextEligibleAt,
            });
        }
        catch (error) {
            this.logger.error('Failed to evaluate schedule', error instanceof Error ? error : new Error(String(error)), { scheduleId: scheduledExecution.id, tenantId });
            return (0, scheduler_runner_model_1.createRunnerScheduleDecision)({
                scheduleId: scheduledExecution.id,
                shouldTrigger: false,
                reason: `Evaluation failed: ${error.message}`,
                blockedBy: 'ERROR',
                nextEligibleAt: null,
            });
        }
    }
};
exports.SchedulerRunner = SchedulerRunner;
exports.SchedulerRunner = SchedulerRunner = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(1, (0, tsyringe_1.inject)(core_1.TOKENS.Logger)),
    __metadata("design:paramtypes", [Object, Object])
], SchedulerRunner);
//# sourceMappingURL=scheduler-runner.js.map