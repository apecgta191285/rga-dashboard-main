import { ScheduleDefinition, SchedulePolicy } from '../schedule/schedule.model';
import { TriggerType } from '../trigger/execution-trigger.model';
export interface ExecutionParams {
    readonly triggerType: TriggerType;
    readonly requestedBy: string;
    readonly dryRunDefault: boolean;
    readonly metadata?: {
        readonly source?: string;
        readonly scheduleId?: string;
        readonly reason?: string;
        readonly [key: string]: unknown;
    };
}
export interface ScheduledExecution {
    readonly id: string;
    readonly tenantId: string;
    readonly schedule: ScheduleDefinition;
    readonly policy: SchedulePolicy;
    readonly executionParams: ExecutionParams;
    readonly enabled: boolean;
}
export interface IScheduleProvider {
    getSchedulesForTenant(tenantId: string): Promise<ScheduledExecution[]>;
}
export declare function createExecutionParams(params?: Partial<ExecutionParams>): ExecutionParams;
export declare function createScheduledExecution(params: Omit<ScheduledExecution, 'id'> & {
    id?: string;
}): ScheduledExecution;
export declare function validateScheduledExecution(execution: unknown): {
    valid: boolean;
    errors: string[];
};
