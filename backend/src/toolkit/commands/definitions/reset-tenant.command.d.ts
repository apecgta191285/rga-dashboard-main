import { ICommand, CommandName } from '../../core/contracts';
import { ResetConfirmation } from '../../services/tenant-reset.service';
export declare const RESET_TENANT_COMMAND: CommandName;
export declare const RESET_TENANT_HARD_COMMAND: CommandName;
export interface ResetTenantCommand extends ICommand {
    readonly name: typeof RESET_TENANT_COMMAND;
    readonly tenantId: string;
    readonly mode: 'PARTIAL';
}
export declare function createResetTenantCommand(tenantId: string): ResetTenantCommand;
export interface ResetTenantHardCommand extends ICommand {
    readonly name: typeof RESET_TENANT_HARD_COMMAND;
    readonly tenantId: string;
    readonly mode: 'HARD';
    readonly confirmation: ResetConfirmation;
}
export declare function createResetTenantHardCommand(tenantId: string, confirmation: ResetConfirmation): ResetTenantHardCommand;
