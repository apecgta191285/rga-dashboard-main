import { ExecutionHistoryRecord, HistoryQueryOptions, HistoryQueryResult, ExecutionSummary } from './execution-history.model';
import { ExecutionHistoryRepository } from './execution-history.repository';
export interface InMemoryRepositoryConfig {
    readonly maxRecordsPerTenant: number;
    readonly maxRecordAgeMs: number;
}
export declare class InMemoryExecutionHistoryRepository implements ExecutionHistoryRepository {
    private readonly config;
    private storage;
    constructor(config?: InMemoryRepositoryConfig);
    record(record: ExecutionHistoryRecord, now?: Date): Promise<void>;
    findRecentByTenant(tenantId: string, options?: HistoryQueryOptions): Promise<HistoryQueryResult>;
    countExecutionsInWindow(tenantId: string, windowMs: number, now?: Date): Promise<number>;
    getMostRecent(tenantId: string): Promise<ExecutionHistoryRecord | null>;
    getExecutionSummary(tenantId: string, windowMs: number, now?: Date): Promise<ExecutionSummary>;
    getTotalRecordCount(): number;
    getTenantRecordCount(tenantId: string): number;
    clearAll(): void;
    clearTenant(tenantId: string): void;
    private getTenantRecords;
    private applyFilters;
    private applySorting;
    private evictIfNecessary;
}
