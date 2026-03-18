import { IUiPrinter, ToolkitEnv } from './contracts';
export declare class ConsoleUiPrinter implements IUiPrinter {
    private env;
    constructor(env: ToolkitEnv);
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
