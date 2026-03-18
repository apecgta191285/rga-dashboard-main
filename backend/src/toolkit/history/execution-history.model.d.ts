export type ExecutionHistoryStatus = 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ExecutionHistoryTriggerType = 'MANUAL' | 'PROGRAMMATIC';
export interface ExecutionHistoryRecord {
    readonly executionId: string;
    readonly tenantId: string;
    readonly triggerType: ExecutionHistoryTriggerType;
    readonly requestedBy: string;
    readonly status: ExecutionHistoryStatus;
    readonly startedAt: Date;
    readonly finishedAt: Date;
    readonly durationMs: number;
    readonly dryRun: boolean;
    readonly ruleCount: number;
    readonly triggeredAlertCount: number;
    readonly failureReason?: string;
    readonly errorCode?: string;
    readonly metadata?: {
        readonly correlationId?: string;
        readonly executionMode?: string;
        readonly snapshotCount?: number;
        readonly triggeredRuleIds?: string[];
        readonly [key: string]: unknown;
    };
}
export interface HistoryQueryOptions {
    readonly limit?: number;
    readonly offset?: number;
    readonly startTime?: Date;
    readonly endTime?: Date;
    readonly status?: ExecutionHistoryStatus;
    readonly dryRun?: boolean;
    readonly order?: 'asc' | 'desc';
}
export interface HistoryQueryResult {
    readonly records: ExecutionHistoryRecord[];
    readonly totalCount: number;
    readonly hasMore: boolean;
}
export interface ExecutionSummary {
    readonly totalExecutions: number;
    readonly completedCount: number;
    readonly failedCount: number;
    readonly cancelledCount: number;
    readonly lastExecutionAt?: Date;
    readonly averageDurationMs: number;
    readonly windowStartAt: Date;
    readonly windowEndAt: Date;
}
export declare function createExecutionHistoryRecord(params: {
    executionId: string;
    tenantId: string;
    triggerType: ExecutionHistoryTriggerType;
    requestedBy: string;
    status: ExecutionHistoryStatus;
    startedAt: Date;
    finishedAt: Date;
    dryRun: boolean;
    ruleCount: number;
    triggeredAlertCount: number;
    failureReason?: string;
    errorCode?: string;
    metadata?: ExecutionHistoryRecord['metadata'];
}): ExecutionHistoryRecord;
export declare function createQueryOptions(options?: Partial<HistoryQueryOptions>): HistoryQueryOptions;
export declare function isInCooldownPeriod(lastExecutionAt: Date | undefined, cooldownMs: number, now: Date): boolean;
export declare function getRemainingCooldownMs(lastExecutionAt: Date, cooldownMs: number, now: Date): number;
export declare function filterByTimeWindow(records: ExecutionHistoryRecord[], windowMs: number, now: Date): ExecutionHistoryRecord[];
export declare function calculateExecutionSummary(records: ExecutionHistoryRecord[], windowStart: Date, windowEnd: Date): ExecutionSummary;
