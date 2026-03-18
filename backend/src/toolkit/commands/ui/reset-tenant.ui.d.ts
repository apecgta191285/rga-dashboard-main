import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
export declare class ResetTenantUi implements CommandUi {
    readonly name = "reset-tenant";
    execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void>;
}
