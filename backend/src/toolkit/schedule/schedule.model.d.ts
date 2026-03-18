export type ScheduleType = 'ONCE' | 'INTERVAL' | 'CALENDAR';
export declare const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string>;
export interface IntervalConfig {
    readonly minutes?: number;
    readonly hours?: number;
    readonly days?: number;
}
export interface CalendarConfig {
    readonly dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    readonly dayOfMonth?: number;
    readonly hour?: number;
    readonly minute?: number;
}
export interface ScheduleDefinition {
    readonly scheduleId: string;
    readonly tenantId: string;
    readonly name: string;
    readonly type: ScheduleType;
    readonly config: IntervalConfig | CalendarConfig | {
        targetDate: string;
    };
    readonly timezone: string;
    readonly enabled: boolean;
    readonly description?: string;
    readonly metadata?: {
        readonly createdBy?: string;
        readonly createdAt?: string;
        readonly updatedAt?: string;
        readonly version?: number;
    };
}
export interface TimeWindow {
    readonly startTime: string;
    readonly endTime: string;
    readonly daysOfWeek?: number[];
}
export interface SchedulePolicy {
    readonly allowedTimeWindows?: TimeWindow[];
    readonly excludedDates?: string[];
    readonly excludedDaysOfWeek?: number[];
    readonly cooldownPeriodMs?: number;
    readonly maxExecutionsPerWindow?: number;
    readonly executionWindowMs?: number;
    readonly skipMissed?: boolean;
}
export interface ExecutionHistorySummary {
    readonly lastExecutionAt?: Date;
    readonly executionsInWindow: number;
    readonly windowStartAt?: Date;
    readonly recentExecutions: Date[];
}
export interface ScheduleEvaluationContext {
    readonly now: Date;
    readonly executionHistory: ExecutionHistorySummary;
    readonly dryRun: boolean;
    readonly correlationId?: string;
}
export type BlockReason = 'COOLDOWN' | 'WINDOW' | 'LIMIT' | 'EXCLUDED_DATE' | 'EXCLUDED_DAY' | 'DISABLED' | 'NOT_YET' | 'ALREADY_RAN';
export interface ScheduleDecision {
    readonly shouldTrigger: boolean;
    readonly reason: string;
    readonly nextEligibleAt: Date | null;
    readonly blockedBy?: BlockReason;
    readonly details?: {
        readonly cooldownRemainingMs?: number;
        readonly currentWindow?: TimeWindow;
        readonly executionsInWindow?: number;
        readonly maxExecutions?: number;
    };
    readonly evaluatedAt: Date;
}
export declare function createScheduleDefinition(params: Omit<ScheduleDefinition, 'scheduleId' | 'metadata'> & {
    scheduleId?: string;
    metadata?: ScheduleDefinition['metadata'];
}): ScheduleDefinition;
export declare function createSchedulePolicy(params: SchedulePolicy): SchedulePolicy;
export declare function createEvaluationContext(params: Omit<ScheduleEvaluationContext, 'now'> & {
    now?: Date;
}): ScheduleEvaluationContext;
export declare function createTriggerDecision(context: ScheduleEvaluationContext, reason: string, nextEligibleAt: Date | null): ScheduleDecision;
export declare function createBlockDecision(context: ScheduleEvaluationContext, reason: string, blockedBy: BlockReason, nextEligibleAt: Date | null, details?: ScheduleDecision['details']): ScheduleDecision;
export declare function toTimezone(date: Date, timezone: string): Date;
export declare function getStartOfDay(date: Date, timezone: string): Date;
export declare function parseTime(timeStr: string): number;
export declare function isExcludedDate(date: Date, excludedDates: string[]): boolean;
