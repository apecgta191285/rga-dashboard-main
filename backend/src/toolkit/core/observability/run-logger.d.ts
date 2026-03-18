import { IRunLogger, IUiPrinter, IOpsLogger } from './contracts';
export declare class RunLogger implements IRunLogger {
    readonly printer: IUiPrinter;
    readonly ops: IOpsLogger;
    constructor(printer: IUiPrinter, ops: IOpsLogger);
}
