import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
export declare class SeedUnifiedUi implements CommandUi {
    readonly name = "seed-unified-scenario";
    execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void>;
    private displayResult;
}
