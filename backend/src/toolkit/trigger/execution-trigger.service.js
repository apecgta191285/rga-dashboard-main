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
exports.ExecutionTriggerService = void 0;
const tsyringe_1 = require("tsyringe");
const core_1 = require("../core");
const alert_execution_service_1 = require("../services/alert-execution.service");
const execution_trigger_model_1 = require("./execution-trigger.model");
const execution_history_service_1 = require("../history/execution-history.service");
const DEFAULT_CONFIG = {
    maxConcurrentPerTenant: 0,
    allowDryRun: true,
};
let ExecutionTriggerService = class ExecutionTriggerService {
    constructor(alertExecutionService, logger, historyService, config = DEFAULT_CONFIG) {
        this.alertExecutionService = alertExecutionService;
        this.logger = logger;
        this.historyService = historyService;
        this.config = config;
        this.executionStates = new Map();
    }
    async startExecution(request, ruleProvider, metricProvider) {
        this.logger.info('Execution start requested', {
            tenantId: request.tenantId,
            triggerType: request.triggerType,
            requestedBy: request.requestedBy,
        });
        const validation = this.validateRequest(request);
        if (!validation.valid) {
            this.logger.warn('Execution request validation failed', {
                errors: validation.errors,
                tenantId: request.tenantId,
            });
            return (0, execution_trigger_model_1.createStartRejection)('Validation failed', validation.errors);
        }
        const trigger = (0, execution_trigger_model_1.createExecutionTrigger)(request);
        let state = (0, execution_trigger_model_1.createExecutionState)(trigger);
        this.executionStates.set(trigger.executionId, state);
        const preconditions = this.checkPreconditions(trigger);
        if (!preconditions.valid) {
            this.logger.warn('Execution preconditions not met', {
                executionId: trigger.executionId,
                errors: preconditions.errors,
            });
            state = this.updateState(trigger.executionId, 'CANCELLED', preconditions.errors.join(', '));
            return (0, execution_trigger_model_1.createStartRejection)(preconditions.errors.join(', '), preconditions.errors, trigger.executionId);
        }
        state = this.updateState(trigger.executionId, 'STARTED');
        this.logger.info('Execution started', {
            executionId: trigger.executionId,
            tenantId: trigger.tenantId,
        });
        try {
            const executionContext = this.buildExecutionContext(trigger);
            const result = await this.alertExecutionService.execute(executionContext, ruleProvider, metricProvider);
            const finalStatus = result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
            state = this.updateState(trigger.executionId, finalStatus, result.error?.message);
            this.logger.info('Execution completed', {
                executionId: trigger.executionId,
                status: finalStatus,
                triggeredAlerts: result.summary.triggeredCount,
            });
            if (this.historyService) {
                try {
                    await this.historyService.recordExecution(state, result);
                }
                catch (historyError) {
                    this.logger.warn('Failed to record execution history', {
                        executionId: trigger.executionId,
                        error: historyError.message,
                    });
                }
            }
            return (0, execution_trigger_model_1.createStartSuccess)(trigger.executionId, finalStatus);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            state = this.updateState(trigger.executionId, 'FAILED', errorMessage);
            this.logger.error('Execution failed with unexpected error', error instanceof Error ? error : new Error(String(error)), { executionId: trigger.executionId });
            if (this.historyService) {
                try {
                    const failedResult = {
                        runId: trigger.executionId,
                        context: this.buildExecutionContext(trigger),
                        timing: {
                            startedAt: state.startedAt ?? trigger.createdAt,
                            completedAt: state.completedAt ?? state.startedAt ?? trigger.createdAt,
                            durationMs: 0,
                        },
                        summary: {
                            totalRules: 0,
                            enabledRules: 0,
                            triggeredCount: 0,
                            notTriggeredCount: 0,
                            snapshotsEvaluated: 0,
                        },
                        triggeredAlerts: [],
                        status: 'FAILED',
                        error: {
                            message: errorMessage,
                            code: 'EXECUTION_FAILED',
                        },
                    };
                    await this.historyService.recordExecution(state, failedResult);
                }
                catch (historyError) {
                    this.logger.warn('Failed to record execution history', {
                        executionId: trigger.executionId,
                        error: historyError.message,
                    });
                }
            }
            return (0, execution_trigger_model_1.createStartRejection)(errorMessage, [errorMessage], trigger.executionId);
        }
    }
    cancelExecution(executionId, reason, cancelledBy) {
        const state = this.executionStates.get(executionId);
        if (!state) {
            this.logger.warn('Cannot cancel: execution not found', {
                executionId,
            });
            return false;
        }
        if ((0, execution_trigger_model_1.isTerminalStatus)(state.status)) {
            this.logger.warn('Cannot cancel: execution already in terminal state', { executionId, status: state.status });
            return false;
        }
        const newState = this.updateState(executionId, 'CANCELLED', `Cancelled by ${cancelledBy}: ${reason}`);
        if (newState) {
            this.logger.info('Execution cancelled', {
                executionId,
                cancelledBy,
                reason,
            });
            return true;
        }
        return false;
    }
    getExecutionState(executionId) {
        return this.executionStates.get(executionId) ?? null;
    }
    getActiveExecutions(tenantId) {
        return Array.from(this.executionStates.values()).filter((state) => state.trigger.tenantId === tenantId &&
            !(0, execution_trigger_model_1.isTerminalStatus)(state.status));
    }
    cleanupTerminalExecutions(maxAgeMs = 3600000, now) {
        const currentTime = now ?? new Date();
        const nowMs = currentTime.getTime();
        let cleaned = 0;
        for (const [id, state] of this.executionStates) {
            if ((0, execution_trigger_model_1.isTerminalStatus)(state.status) &&
                state.completedAt &&
                nowMs - state.completedAt.getTime() > maxAgeMs) {
                this.executionStates.delete(id);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            this.logger.debug(`Cleaned up ${cleaned} terminal executions`);
        }
        return cleaned;
    }
    validateRequest(request) {
        const errors = [];
        if (!request.tenantId || request.tenantId.trim() === '') {
            errors.push('tenantId is required');
        }
        if (!request.requestedBy || request.requestedBy.trim() === '') {
            errors.push('requestedBy is required');
        }
        const validTriggerTypes = ['MANUAL', 'PROGRAMMATIC'];
        if (!validTriggerTypes.includes(request.triggerType)) {
            errors.push(`triggerType must be one of: ${validTriggerTypes.join(', ')}`);
        }
        if (request.dryRun && !this.config.allowDryRun) {
            errors.push('Dry run is not allowed');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    checkPreconditions(trigger) {
        const errors = [];
        if (this.config.maxConcurrentPerTenant > 0) {
            const activeExecutions = this.getActiveExecutions(trigger.tenantId);
            const otherActiveCount = activeExecutions.filter(e => e.executionId !== trigger.executionId).length;
            if (otherActiveCount >= this.config.maxConcurrentPerTenant) {
                errors.push(`Maximum concurrent executions (${this.config.maxConcurrentPerTenant}) ` +
                    `reached for tenant ${trigger.tenantId}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    buildExecutionContext(trigger) {
        const executionMode = trigger.triggerType === 'MANUAL' ? 'MANUAL' : 'SCHEDULED';
        return {
            tenantId: trigger.tenantId,
            executionTime: trigger.createdAt,
            dryRun: trigger.dryRun,
            executionMode,
            correlationId: trigger.metadata?.correlationId,
            triggeredBy: trigger.requestedBy,
        };
    }
    updateState(executionId, newStatus, errorMessage) {
        const currentState = this.executionStates.get(executionId);
        if (!currentState) {
            return null;
        }
        const newState = (0, execution_trigger_model_1.transitionState)(currentState, newStatus, errorMessage);
        if (!newState) {
            this.logger.warn(`Invalid state transition: ${currentState.status} → ${newStatus}`, { executionId });
            return null;
        }
        this.executionStates.set(executionId, newState);
        return newState;
    }
};
exports.ExecutionTriggerService = ExecutionTriggerService;
exports.ExecutionTriggerService = ExecutionTriggerService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(alert_execution_service_1.AlertExecutionService)),
    __param(1, (0, tsyringe_1.inject)(core_1.TOKENS.Logger)),
    __param(2, (0, tsyringe_1.inject)('ExecutionHistoryService')),
    __metadata("design:paramtypes", [alert_execution_service_1.AlertExecutionService, Object, execution_history_service_1.ExecutionHistoryService, Object])
], ExecutionTriggerService);
//# sourceMappingURL=execution-trigger.service.js.map