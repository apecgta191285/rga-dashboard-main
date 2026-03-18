export type TriggerType = 'MANUAL' | 'PROGRAMMATIC';
export declare const TRIGGER_TYPE_LABELS: Record<TriggerType, string>;
export type ExecutionStatus = 'CREATED' | 'STARTED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export declare const TERMINAL_STATUSES: ExecutionStatus[];
export declare function isTerminalStatus(status: ExecutionStatus): boolean;
export declare const VALID_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]>;
export declare function isValidTransition(from: ExecutionStatus, to: ExecutionStatus): boolean;
export interface ExecutionTrigger {
    readonly executionId: string;
    readonly tenantId: string;
    readonly triggerType: TriggerType;
    readonly requestedBy: string;
    readonly dryRun: boolean;
    readonly createdAt: Date;
    readonly metadata?: {
        readonly correlationId?: string;
        readonly sourceIp?: string;
        readonly userAgent?: string;
        readonly reason?: string;
        readonly [key: string]: unknown;
    };
}
export interface ExecutionStartRequest {
    readonly tenantId: string;
    readonly triggerType: TriggerType;
    readonly requestedBy: string;
    readonly dryRun?: boolean;
    readonly metadata?: ExecutionTrigger['metadata'];
}
export interface ExecutionStartResult {
    readonly accepted: boolean;
    readonly executionId?: string;
    readonly status: ExecutionStatus;
    readonly timestamp: Date;
    readonly rejectionReason?: string;
    readonly validationErrors?: string[];
}
export interface ExecutionState {
    readonly executionId: string;
    readonly status: ExecutionStatus;
    readonly trigger: ExecutionTrigger;
    readonly startedAt: Date | null;
    readonly completedAt: Date | null;
    readonly errorMessage?: string;
}
export declare function generateExecutionId(): string;
export declare function createExecutionTrigger(request: ExecutionStartRequest): ExecutionTrigger;
export declare function createExecutionState(trigger: ExecutionTrigger): ExecutionState;
export declare function createStartSuccess(executionId: string, initialStatus?: ExecutionStatus): ExecutionStartResult;
export declare function createStartRejection(reason: string, validationErrors?: string[], executionId?: string): ExecutionStartResult;
export declare function transitionState(state: ExecutionState, newStatus: ExecutionStatus, errorMessage?: string): ExecutionState | null;
