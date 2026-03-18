import { ILogger, IToolkitConfiguration } from '../core/contracts';
export declare class PinoLogger implements ILogger {
    private config;
    private readonly logger;
    constructor(config: IToolkitConfiguration);
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;
    child(bindings: Record<string, unknown>): ILogger;
}
