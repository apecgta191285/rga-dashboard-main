import { ICommand, CommandName } from '../../core/contracts';
export declare const SEED_GOOGLE_ADS_COMMAND: CommandName;
export interface SeedGoogleAdsCommand extends ICommand {
    readonly name: typeof SEED_GOOGLE_ADS_COMMAND;
    readonly tenantId: string;
    readonly days: number;
}
export declare function createSeedGoogleAdsCommand(tenantId: string, days?: number): SeedGoogleAdsCommand;
