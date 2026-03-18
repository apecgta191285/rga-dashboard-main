import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
export declare class SeedGoogleAdsUi implements CommandUi {
    readonly name = "seed-google-ads";
    execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void>;
    private displayResult;
}
