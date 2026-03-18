import { ILogger } from '../core';
import { ExecutionHistoryRecord, HistoryQueryOptions, HistoryQueryResult, ExecutionSummary } from './execution-history.model';
import { ExecutionHistoryRepository } from './execution-history.repository';
import { ExecutionResult } from '../services/alert-execution.service';
import { ExecutionState } from '../trigger/execution-trigger.model';
export interface ExecutionHistoryServiceConfig {
    readonly logPersistenceFailures: boolean;
    readonly includeTriggeredRules: boolean;
}
export declare class ExecutionHistoryService {
    private readonly repository;
    private readonly logger;
    private readonly config;
    constructor(repository: ExecutionHistoryRepository, logger: ILogger, config?: ExecutionHistoryServiceConfig);
    recordExecution(state: ExecutionState, result: ExecutionResult): Promise<ExecutionHistoryRecord>;
    findRecent(tenantId: string, options?: HistoryQueryOptions): Promise<HistoryQueryResult>;
    getMostRecent(tenantId: string): Promise<ExecutionHistoryRecord | null>;
    countInWindow(tenantId: string, windowMs: number, now?: Date): Promise<number>;
    getSummary(tenantId: string, windowMs: number, now?: Date): Promise<ExecutionSummary>;
    isInCooldown(tenantId: string, cooldownMs: number, now: Date): Promise<boolean>;
    getRemainingCooldown(tenantId: string, cooldownMs: number, now: Date): Promise<number>;
    wouldExceedRateLimit(tenantId: string, maxExecutions: number, windowMs: number, now?: Date): Promise<boolean>;
    private normalizeToRecord;
    private mapStatus;
    private mapTriggerType;
}
