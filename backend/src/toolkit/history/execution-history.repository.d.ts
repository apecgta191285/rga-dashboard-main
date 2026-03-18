import { ExecutionHistoryRecord, HistoryQueryOptions, HistoryQueryResult, ExecutionSummary } from './execution-history.model';
export interface Clock {
    now(): Date;
}
export declare const SystemClock: Clock;
export interface ExecutionHistoryRepository {
    record(record: ExecutionHistoryRecord, now?: Date): Promise<void>;
    findRecentByTenant(tenantId: string, options?: HistoryQueryOptions): Promise<HistoryQueryResult>;
    countExecutionsInWindow(tenantId: string, windowMs: number, now?: Date): Promise<number>;
    getMostRecent(tenantId: string): Promise<ExecutionHistoryRecord | null>;
    getExecutionSummary(tenantId: string, windowMs: number, now?: Date): Promise<ExecutionSummary>;
}
export declare class HistoryPersistenceError extends Error {
    readonly executionId: string;
    readonly cause?: Error;
    constructor(message: string, executionId: string, cause?: Error);
}
export declare class HistoryQueryError extends Error {
    readonly invalidParams?: Record<string, unknown>;
    constructor(message: string, invalidParams?: Record<string, unknown>);
}
