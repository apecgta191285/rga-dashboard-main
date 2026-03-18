import { ILogger } from '../core';
import { AlertExecutionService, IRuleProvider, IMetricProvider } from '../services/alert-execution.service';
import { ExecutionStartRequest, ExecutionStartResult, ExecutionState } from './execution-trigger.model';
import { ExecutionHistoryService } from '../history/execution-history.service';
export interface TriggerServiceConfig {
    readonly maxConcurrentPerTenant: number;
    readonly allowDryRun: boolean;
}
export declare class ExecutionTriggerService {
    private readonly alertExecutionService;
    private readonly logger;
    private readonly historyService?;
    private readonly config;
    private executionStates;
    constructor(alertExecutionService: AlertExecutionService, logger: ILogger, historyService?: ExecutionHistoryService, config?: TriggerServiceConfig);
    startExecution(request: ExecutionStartRequest, ruleProvider: IRuleProvider, metricProvider: IMetricProvider): Promise<ExecutionStartResult>;
    cancelExecution(executionId: string, reason: string, cancelledBy: string): boolean;
    getExecutionState(executionId: string): ExecutionState | null;
    getActiveExecutions(tenantId: string): ExecutionState[];
    cleanupTerminalExecutions(maxAgeMs?: number, now?: Date): number;
    private validateRequest;
    private checkPreconditions;
    private buildExecutionContext;
    private updateState;
}
