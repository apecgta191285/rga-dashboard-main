import { IExecutionContext, TenantId, ILogger, IUiPrinter } from './contracts';
export declare class ExecutionContextFactory {
    static create(params: {
        tenantId: TenantId | string;
        logger: ILogger;
        printer: IUiPrinter;
        runId: string;
        dryRun?: boolean;
        verbose?: boolean;
    }): IExecutionContext;
}
