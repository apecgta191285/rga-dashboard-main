import { ScheduledExecution, IScheduleProvider } from './scheduled-execution.model';
export declare class InMemoryScheduleProvider implements IScheduleProvider {
    private storage;
    getSchedulesForTenant(tenantId: string): Promise<ScheduledExecution[]>;
    addSchedule(tenantId: string, execution: ScheduledExecution): {
        success: boolean;
        errors?: string[];
    };
    removeSchedule(tenantId: string, scheduleId: string): boolean;
    getSchedule(tenantId: string, scheduleId: string): ScheduledExecution | null;
    getAllSchedules(tenantId: string): ScheduledExecution[];
    clearTenant(tenantId: string): void;
    clearAll(): void;
    hasSchedule(tenantId: string, scheduleId: string): boolean;
    getScheduleCount(tenantId: string): number;
    private getTenantStorage;
}
