import { ILogger } from '../contracts';
export type ToolkitEnv = 'LOCAL' | 'CI';
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
export interface IOpsLogger extends ILogger {
    child(bindings: Record<string, string | number | boolean>): IOpsLogger;
}
export interface IRunLogger {
    readonly printer: IUiPrinter;
    readonly ops: IOpsLogger;
}
export interface IObservabilityContext {
    readonly runId: string;
    readonly commandName: string;
    readonly env: ToolkitEnv;
    readonly tenantId?: string;
    readonly scenarioId?: string;
    readonly seed?: number;
    readonly mode?: string;
}
