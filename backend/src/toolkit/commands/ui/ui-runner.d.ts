import { ICommand, TenantId, ICommandRegistry } from '../../core';
export interface RunResult {
    success: boolean;
    data?: unknown;
}
export declare function runCommandSafe(command: ICommand, tenantId: TenantId, registry: ICommandRegistry, options: {
    dryRun: boolean;
}): Promise<RunResult>;
