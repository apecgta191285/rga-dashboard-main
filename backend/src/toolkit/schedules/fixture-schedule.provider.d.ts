import { ILogger } from '../core';
import { ScheduledExecution, IScheduleProvider } from './scheduled-execution.model';
export interface FixtureScheduleProviderConfig {
    readonly fixturesDir?: string;
}
export declare class FixtureScheduleProvider implements IScheduleProvider {
    private cache;
    private readonly logger;
    private readonly fixturesDir;
    constructor(logger: ILogger, config?: FixtureScheduleProviderConfig);
    getSchedulesForTenant(tenantId: string): Promise<ScheduledExecution[]>;
    clearCache(): void;
    private loadAllSchedules;
    private loadFixtureFile;
    private resolveFixturesDir;
}
