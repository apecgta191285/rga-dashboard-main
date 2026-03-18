export interface IUiPrinter {
    log(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    header(text: string): void;
    spinner(text: string): {
        start: () => void;
        succeed: (text?: string) => void;
        fail: (text?: string) => void;
        stop: () => void;
    };
}
export type TenantId = string & {
    readonly __brand: 'TenantId';
};
export declare function createTenantId(id: string): TenantId;
export type CommandName = string & {
    readonly __brand: 'CommandName';
};
export declare function createCommandName(name: string): CommandName;
export type Result<T, E = ToolkitError> = {
    readonly kind: 'success';
    readonly value: T;
} | {
    readonly kind: 'failure';
    readonly error: E;
};
export declare const Result: {
    readonly success: <T>(value: T) => Result<T, never>;
    readonly failure: <E>(error: E) => Result<never, E>;
    readonly match: <T, E, R>(result: Result<T, E>, handlers: {
        success: (value: T) => R;
        failure: (error: E) => R;
    }) => R;
};
export interface IExecutionContext {
    readonly tenantId: TenantId;
    readonly correlationId: string;
    readonly startedAt: Date;
    readonly dryRun: boolean;
    readonly verbose: boolean;
    readonly runId: string;
    readonly logger: ILogger;
    readonly printer: IUiPrinter;
    with(props: Partial<IExecutionContext>): IExecutionContext;
    elapsedMs(): number;
}
export interface ICommand {
    readonly name: CommandName;
    readonly description: string;
    readonly requiresConfirmation: boolean;
}
export interface ICommandMetadata {
    readonly name: string;
    readonly displayName: string;
    readonly description: string;
    readonly icon: string;
    readonly category: 'data' | 'testing' | 'maintenance' | 'diagnostics';
    readonly estimatedDurationSeconds: number;
    readonly risks: ReadonlyArray<string>;
}
export interface ICommandHandler<TCommand extends ICommand = ICommand, TResult = unknown> {
    canHandle(command: ICommand): command is TCommand;
    execute(command: TCommand, context: IExecutionContext): Promise<Result<TResult>>;
    getMetadata(): ICommandMetadata;
    validate(command: TCommand): Result<void>;
}
export interface ICommandRegistry {
    register(handler: ICommandHandler): void;
    resolve(commandName: CommandName): ICommandHandler | null;
    listAll(): ReadonlyArray<{
        command: ICommand;
        handler: ICommandHandler;
    }>;
    has(commandName: CommandName): boolean;
}
export interface ILogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;
    child(bindings: Record<string, unknown>): ILogger;
}
export interface IToolkitConfiguration {
    readonly environment: 'development' | 'staging' | 'production';
    readonly database: {
        readonly url: string;
        readonly timeoutMs: number;
        readonly maxRetries: number;
    };
    readonly api: {
        readonly baseUrl: string;
        readonly timeoutMs: number;
        readonly retryAttempts: number;
        readonly retryDelayMs: number;
    };
    readonly logging: {
        readonly level: 'debug' | 'info' | 'warn' | 'error';
        readonly format: 'json' | 'pretty';
    };
    readonly features: {
        readonly enableDryRun: boolean;
        readonly confirmDestructiveActions: boolean;
        readonly maxConcurrentCommands: number;
    };
}
export interface ISessionStore {
    getLastTenantId(): Promise<TenantId | null>;
    setLastTenantId(tenantId: TenantId): Promise<void>;
    getCache<T>(key: string): Promise<T | null>;
    setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
    addToHistory(entry: CommandHistoryEntry): Promise<void>;
    getHistory(limit: number): Promise<ReadonlyArray<CommandHistoryEntry>>;
}
export interface CommandHistoryEntry {
    readonly timestamp: Date;
    readonly commandName: CommandName;
    readonly tenantId: TenantId;
    readonly success: boolean;
    readonly durationMs: number;
    readonly errorMessage?: string;
}
export declare abstract class ToolkitError extends Error {
    abstract readonly code: string;
    abstract readonly isRecoverable: boolean;
    constructor(message: string);
}
export declare class InvalidTenantIdError extends ToolkitError {
    readonly code = "INVALID_TENANT_ID";
    readonly isRecoverable = false;
}
export declare class InvalidCommandNameError extends ToolkitError {
    readonly code = "INVALID_COMMAND_NAME";
    readonly isRecoverable = false;
}
export declare class CommandNotFoundError extends ToolkitError {
    readonly code = "COMMAND_NOT_FOUND";
    readonly isRecoverable = true;
}
export declare class ValidationError extends ToolkitError {
    readonly fieldErrors: ReadonlyArray<{
        field: string;
        message: string;
    }>;
    readonly code = "VALIDATION_ERROR";
    readonly isRecoverable = true;
    constructor(message: string, fieldErrors: ReadonlyArray<{
        field: string;
        message: string;
    }>);
}
export declare class DatabaseConnectionError extends ToolkitError {
    readonly code = "DB_CONNECTION_FAILED";
    readonly isRecoverable = true;
}
export declare class ApiConnectionError extends ToolkitError {
    readonly code = "API_CONNECTION_FAILED";
    readonly isRecoverable = true;
}
