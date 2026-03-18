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
exports.ExecutionHistoryService = void 0;
const tsyringe_1 = require("tsyringe");
const core_1 = require("../core");
const execution_history_model_1 = require("./execution-history.model");
const DEFAULT_CONFIG = {
    logPersistenceFailures: true,
    includeTriggeredRules: true,
};
let ExecutionHistoryService = class ExecutionHistoryService {
    constructor(repository, logger, config = DEFAULT_CONFIG) {
        this.repository = repository;
        this.logger = logger;
        this.config = config;
    }
    async recordExecution(state, result) {
        const record = this.normalizeToRecord(state, result);
        try {
            await this.repository.record(record);
            this.logger.debug('Execution history recorded', {
                executionId: record.executionId,
                tenantId: record.tenantId,
                status: record.status,
            });
        }
        catch (error) {
            if (this.config.logPersistenceFailures) {
                this.logger.warn('Failed to record execution history', {
                    executionId: record.executionId,
                    error: error.message,
                });
            }
        }
        return record;
    }
    async findRecent(tenantId, options) {
        return this.repository.findRecentByTenant(tenantId, options);
    }
    async getMostRecent(tenantId) {
        return this.repository.getMostRecent(tenantId);
    }
    async countInWindow(tenantId, windowMs, now) {
        return this.repository.countExecutionsInWindow(tenantId, windowMs, now);
    }
    async getSummary(tenantId, windowMs, now) {
        return this.repository.getExecutionSummary(tenantId, windowMs, now);
    }
    async isInCooldown(tenantId, cooldownMs, now) {
        const mostRecent = await this.repository.getMostRecent(tenantId);
        return (0, execution_history_model_1.isInCooldownPeriod)(mostRecent?.finishedAt, cooldownMs, now);
    }
    async getRemainingCooldown(tenantId, cooldownMs, now) {
        const mostRecent = await this.repository.getMostRecent(tenantId);
        if (!mostRecent) {
            return 0;
        }
        return (0, execution_history_model_1.getRemainingCooldownMs)(mostRecent.finishedAt, cooldownMs, now);
    }
    async wouldExceedRateLimit(tenantId, maxExecutions, windowMs, now) {
        if (maxExecutions <= 0) {
            return false;
        }
        const count = await this.repository.countExecutionsInWindow(tenantId, windowMs, now);
        return count >= maxExecutions;
    }
    normalizeToRecord(state, result) {
        const status = this.mapStatus(state.status);
        const triggerType = this.mapTriggerType(state.trigger.triggerType);
        const metadata = {
            correlationId: state.trigger.metadata?.correlationId,
            executionMode: result.context.executionMode,
            snapshotCount: result.summary.snapshotsEvaluated,
            triggeredRuleIds: this.config.includeTriggeredRules
                ? result.triggeredAlerts.map((a) => a.rule.id)
                : undefined,
        };
        return (0, execution_history_model_1.createExecutionHistoryRecord)({
            executionId: state.executionId,
            tenantId: state.trigger.tenantId,
            triggerType,
            requestedBy: state.trigger.requestedBy,
            status,
            startedAt: state.startedAt ?? state.trigger.createdAt,
            finishedAt: state.completedAt ?? state.trigger.createdAt,
            dryRun: state.trigger.dryRun,
            ruleCount: result.summary.enabledRules,
            triggeredAlertCount: result.summary.triggeredCount,
            failureReason: state.errorMessage ?? result.error?.message,
            errorCode: result.error?.code,
            metadata,
        });
    }
    mapStatus(status) {
        switch (status) {
            case 'COMPLETED':
                return 'COMPLETED';
            case 'FAILED':
                return 'FAILED';
            case 'CANCELLED':
                return 'CANCELLED';
            case 'CREATED':
            case 'STARTED':
                return 'FAILED';
            default:
                return 'FAILED';
        }
    }
    mapTriggerType(triggerType) {
        return triggerType;
    }
};
exports.ExecutionHistoryService = ExecutionHistoryService;
exports.ExecutionHistoryService = ExecutionHistoryService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ExecutionHistoryRepository')),
    __param(1, (0, tsyringe_1.inject)(core_1.TOKENS.Logger)),
    __metadata("design:paramtypes", [Object, Object, Object])
], ExecutionHistoryService);
//# sourceMappingURL=execution-history.service.js.map