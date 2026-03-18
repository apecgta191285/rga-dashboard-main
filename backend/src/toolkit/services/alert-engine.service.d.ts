export interface MetricSnapshot {
    readonly tenantId: string;
    readonly campaignId: string;
    readonly date: Date;
    readonly platform: string;
    readonly metrics: {
        readonly impressions: number;
        readonly clicks: number;
        readonly conversions: number;
        readonly spend: number;
        readonly revenue: number;
        readonly ctr: number;
        readonly cpc: number;
        readonly cvr: number;
        readonly roas: number;
    };
}
export interface BaselineSnapshot {
    readonly metrics: MetricSnapshot['metrics'];
    readonly dateRange: {
        readonly start: Date;
        readonly end: Date;
    };
}
export interface EvaluationContext {
    readonly tenantId: string;
    readonly dateRange: {
        readonly start: Date;
        readonly end: Date;
    };
    readonly dryRun: boolean;
}
export interface AlertRule {
    readonly id: string;
    readonly name: string;
    readonly condition: AlertCondition;
    readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    readonly enabled: boolean;
    readonly tenantId?: string;
}
export type AlertCondition = {
    type: 'THRESHOLD';
    metric: keyof MetricSnapshot['metrics'];
    operator: 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ';
    value: number;
} | {
    type: 'DROP_PERCENT';
    metric: keyof MetricSnapshot['metrics'];
    thresholdPercent: number;
} | {
    type: 'ZERO_CONVERSIONS';
    minSpend: number;
};
export interface AlertTriggerResult {
    readonly ruleId: string;
    readonly ruleName: string;
    readonly condition: AlertCondition;
    readonly severity: AlertRule['severity'];
    readonly triggered: boolean;
    readonly reason: string;
    readonly evaluatedAt: Date;
    readonly values: {
        readonly current?: number;
        readonly baseline?: number;
        readonly threshold?: number;
        readonly dropPercent?: number;
    };
}
export interface AlertEvaluationResult {
    readonly triggeredAlerts: AlertTriggerResult[];
    readonly evaluatedAt: Date;
    readonly context: EvaluationContext;
    readonly metadata: {
        readonly totalRules: number;
        readonly enabledRules: number;
        readonly triggeredCount: number;
        readonly durationMs: number;
    };
}
export declare class AlertEngine {
    evaluateOnce(snapshot: MetricSnapshot, rules: AlertRule[], context: EvaluationContext): AlertEvaluationResult;
    evaluateCheck(snapshots: MetricSnapshot[], rules: AlertRule[], context: EvaluationContext, baselines?: Map<string, BaselineSnapshot>): AlertEvaluationResult;
    private evaluateRule;
    private evaluateRuleWithBaseline;
    private evaluateThreshold;
    private evaluateDropPercent;
    private evaluateDropPercentWithoutBaseline;
    private evaluateZeroConversions;
    private operatorToString;
    private formatNumber;
    private formatCurrency;
}
export interface AlertCheckConfig {
    readonly tenantId: string;
    readonly timeframe: 'YESTERDAY' | 'TODAY' | 'LAST_7_DAYS';
    readonly campaignIds?: string[];
    readonly ruleIds?: string[];
}
export interface AlertCheckResult {
    readonly success: boolean;
    readonly triggeredAlerts: AlertTriggerResult[];
    readonly evaluatedAt: Date;
    readonly metadata: {
        readonly snapshotsEvaluated: number;
        readonly totalRulesEvaluated: number;
        readonly totalRulesTriggered: number;
        readonly durationMs: number;
    };
}
