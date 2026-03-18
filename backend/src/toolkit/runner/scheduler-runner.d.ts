import { ILogger } from '../core';
import { SchedulePolicyService } from '../schedule/schedule-policy.service';
import { ExecutionHistoryService } from '../history/execution-history.service';
import { IScheduleProvider } from '../schedules/scheduled-execution.model';
import { TickOptions, TickResult } from './scheduler-runner.model';
export interface RunnerDependencies {
    readonly scheduleProvider: IScheduleProvider;
    readonly schedulePolicyService: SchedulePolicyService;
    readonly executionHistoryService: ExecutionHistoryService;
    readonly logger?: ILogger;
}
export declare class SchedulerRunner {
    private readonly deps;
    private readonly logger;
    constructor(deps: RunnerDependencies, logger?: ILogger);
    tickTenant(tenantId: string, now: Date, options?: TickOptions): Promise<TickResult>;
    private loadSchedules;
    private buildHistorySummary;
    private evaluateSchedule;
}
