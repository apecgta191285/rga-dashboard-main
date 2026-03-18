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
exports.AlertExecutionService = void 0;
const tsyringe_1 = require("tsyringe");
const alert_engine_service_1 = require("./alert-engine.service");
let AlertExecutionService = class AlertExecutionService {
    constructor(alertEngine) {
        this.alertEngine = alertEngine;
    }
    async execute(context, ruleProvider, metricProvider) {
        const runId = this.generateRunId();
        const startedAt = new Date();
        try {
            this.validateContext(context);
            const allRules = await ruleProvider.resolveRules(context.tenantId);
            const enabledRules = allRules.filter((rule) => rule.enabled);
            if (enabledRules.length === 0) {
                return this.buildEmptyResult(runId, context, startedAt, 'No enabled rules');
            }
            const dateRange = this.calculateDateRange(context.executionTime);
            const snapshots = await metricProvider.fetchSnapshots(context.tenantId, dateRange);
            if (snapshots.length === 0) {
                return this.buildEmptyResult(runId, context, startedAt, 'No metrics available');
            }
            let baselines;
            if (metricProvider.fetchBaselines) {
                const campaignIds = [...new Set(snapshots.map((s) => s.campaignId))];
                const baselineDateRange = this.calculateBaselineDateRange(dateRange);
                baselines = await metricProvider.fetchBaselines(context.tenantId, campaignIds, baselineDateRange);
            }
            const alertEngineContext = {
                tenantId: context.tenantId,
                dateRange,
                dryRun: context.dryRun,
            };
            const evaluationResult = this.alertEngine.evaluateCheck(snapshots, enabledRules, alertEngineContext, baselines);
            const triggeredAlerts = evaluationResult.triggeredAlerts.map((result) => this.mapToRuleEvaluation(result));
            const completedAt = new Date();
            return {
                runId,
                context,
                timing: {
                    startedAt,
                    completedAt,
                    durationMs: completedAt.getTime() - startedAt.getTime(),
                },
                summary: {
                    totalRules: allRules.length,
                    enabledRules: enabledRules.length,
                    triggeredCount: triggeredAlerts.length,
                    notTriggeredCount: enabledRules.length - triggeredAlerts.length,
                    snapshotsEvaluated: snapshots.length,
                },
                triggeredAlerts,
                status: 'COMPLETED',
            };
        }
        catch (error) {
            const completedAt = new Date();
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                runId,
                context,
                timing: {
                    startedAt,
                    completedAt,
                    durationMs: completedAt.getTime() - startedAt.getTime(),
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
        }
    }
    generateRunId() {
        return `exec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    validateContext(context) {
        if (!context.tenantId) {
            throw new Error('ExecutionContext.tenantId is required');
        }
        if (!context.executionTime) {
            throw new Error('ExecutionContext.executionTime is required');
        }
        if (!context.executionMode) {
            throw new Error('ExecutionContext.executionMode is required');
        }
    }
    calculateDateRange(executionTime) {
        const end = new Date(executionTime);
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        const start = new Date(end);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    }
    calculateBaselineDateRange(currentRange) {
        const duration = currentRange.end.getTime() - currentRange.start.getTime();
        const end = new Date(currentRange.start);
        end.setMilliseconds(end.getMilliseconds() - 1);
        const start = new Date(end);
        start.setTime(start.getTime() - duration);
        return { start, end };
    }
    buildEmptyResult(runId, context, startedAt, reason) {
        const completedAt = new Date();
        return {
            runId,
            context,
            timing: {
                startedAt,
                completedAt,
                durationMs: completedAt.getTime() - startedAt.getTime(),
            },
            summary: {
                totalRules: 0,
                enabledRules: 0,
                triggeredCount: 0,
                notTriggeredCount: 0,
                snapshotsEvaluated: 0,
            },
            triggeredAlerts: [],
            status: 'COMPLETED',
        };
    }
    mapToRuleEvaluation(result) {
        return {
            rule: {
                id: result.ruleId,
                name: result.ruleName,
                condition: result.condition,
                severity: result.severity,
                enabled: true,
            },
            triggered: result.triggered,
            reason: result.reason,
            values: result.values,
            evaluatedAt: result.evaluatedAt,
        };
    }
};
exports.AlertExecutionService = AlertExecutionService;
exports.AlertExecutionService = AlertExecutionService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(alert_engine_service_1.AlertEngine)),
    __metadata("design:paramtypes", [alert_engine_service_1.AlertEngine])
], AlertExecutionService);
//# sourceMappingURL=alert-execution.service.js.map