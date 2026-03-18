import { ExecutionParams } from '../schedules/scheduled-execution.model';
export interface TickOptions {
    readonly dryRun?: boolean;
    readonly maxTriggers?: number;
    readonly includeDecisions?: boolean;
    readonly correlationId?: string;
}
export interface RunnerScheduleDecision {
    readonly scheduleId: string;
    readonly shouldTrigger: boolean;
    readonly reason: string;
    readonly blockedBy?: string;
    readonly nextEligibleAt: string | null;
}
export interface TriggerCandidate {
    readonly scheduleId: string;
    readonly tenantId: string;
    readonly executionParams: ExecutionParams;
    readonly derivedRequest: {
        readonly triggerType: 'MANUAL' | 'PROGRAMMATIC';
        readonly requestedBy: string;
        readonly dryRun: boolean;
    };
}
export interface TickResult {
    readonly tenantId: string;
    readonly now: string;
    readonly evaluatedCount: number;
    readonly triggeredCount: number;
    readonly dryRun: boolean;
    readonly decisions: RunnerScheduleDecision[];
    readonly triggerCandidates: TriggerCandidate[];
}
export declare function createTickOptions(options?: Partial<TickOptions>): TickOptions;
export declare function createTickResult(params: {
    tenantId: string;
    now: Date;
    dryRun: boolean;
    evaluatedCount: number;
    decisions: RunnerScheduleDecision[];
    triggerCandidates: TriggerCandidate[];
}): TickResult;
export declare function createRunnerScheduleDecision(params: {
    scheduleId: string;
    shouldTrigger: boolean;
    reason: string;
    blockedBy?: string;
    nextEligibleAt: Date | null;
}): RunnerScheduleDecision;
export declare function createTriggerCandidate(params: {
    scheduleId: string;
    tenantId: string;
    executionParams: ExecutionParams;
}): TriggerCandidate;
