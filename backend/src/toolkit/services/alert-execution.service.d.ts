import { AlertEngine, AlertRule, MetricSnapshot, BaselineSnapshot } from './alert-engine.service';
export type ExecutionMode = 'MANUAL' | 'SCHEDULED' | 'TEST';
export interface ExecutionContext {
    readonly tenantId: string;
    readonly executionTime: Date;
    readonly dryRun: boolean;
    readonly executionMode: ExecutionMode;
    readonly correlationId?: string;
    readonly triggeredBy?: string;
}
export interface AlertExecutionRun {
    readonly runId: string;
    readonly context: ExecutionContext;
    readonly startedAt: Date;
    readonly completedAt: Date | null;
    readonly status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}
export interface IRuleProvider {
    resolveRules(tenantId: string): Promise<AlertRule[]>;
}
export interface IMetricProvider {
    fetchSnapshots(tenantId: string, dateRange: {
        start: Date;
        end: Date;
    }): Promise<MetricSnapshot[]>;
    fetchBaselines?(tenantId: string, campaignIds: string[], baselineDateRange: {
        start: Date;
        end: Date;
    }): Promise<Map<string, BaselineSnapshot>>;
}
export interface RuleEvaluation {
    readonly rule: AlertRule;
    readonly triggered: boolean;
    readonly reason: string;
    readonly values: {
        readonly current?: number;
        readonly baseline?: number;
        readonly threshold?: number;
        readonly dropPercent?: number;
    };
    readonly evaluatedAt: Date;
}
export interface ExecutionResult {
    readonly runId: string;
    readonly context: ExecutionContext;
    readonly timing: {
        readonly startedAt: Date;
        readonly completedAt: Date;
        readonly durationMs: number;
    };
    readonly summary: {
        readonly totalRules: number;
        readonly enabledRules: number;
        readonly triggeredCount: number;
        readonly notTriggeredCount: number;
        readonly snapshotsEvaluated: number;
    };
    readonly triggeredAlerts: RuleEvaluation[];
    readonly notTriggeredRules?: RuleEvaluation[];
    readonly status: 'COMPLETED' | 'FAILED';
    readonly error?: {
        readonly message: string;
        readonly code: string;
    };
}
export declare class AlertExecutionService {
    private readonly alertEngine;
    constructor(alertEngine: AlertEngine);
    execute(context: ExecutionContext, ruleProvider: IRuleProvider, metricProvider: IMetricProvider): Promise<ExecutionResult>;
    private generateRunId;
    private validateContext;
    private calculateDateRange;
    private calculateBaselineDateRange;
    private buildEmptyResult;
    private mapToRuleEvaluation;
}
