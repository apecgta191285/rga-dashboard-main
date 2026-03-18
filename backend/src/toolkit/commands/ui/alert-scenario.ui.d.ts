import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
export declare class AlertScenarioUi implements CommandUi {
    readonly name = "alert-scenario";
    execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void>;
    private displayResult;
}
