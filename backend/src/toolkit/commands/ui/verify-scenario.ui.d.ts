import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
export declare class VerifyScenarioUi implements CommandUi {
    readonly name = "verify-scenario";
    execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void>;
    private displayResult;
}
