import { IOpsLogger, ToolkitEnv } from './contracts';
export declare class PinoOpsLogger implements IOpsLogger {
    private readonly logger;
    constructor(env: ToolkitEnv, bindings?: Record<string, unknown>);
    info(message: string, meta?: unknown): void;
    info(meta: object, message?: string): void;
    warn(message: string, meta?: unknown): void;
    warn(meta: object, message?: string): void;
    error(message: string, meta?: unknown): void;
    error(meta: object, message?: string): void;
    debug(message: string, meta?: unknown): void;
    debug(meta: object, message?: string): void;
    child(bindings: Record<string, string | number | boolean>): IOpsLogger;
}
