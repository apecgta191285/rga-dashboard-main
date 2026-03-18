import { ICommandHandler, IExecutionContext, Result, ILogger } from '../core/contracts';
import { BaseCommandHandler, IBaseCommandHandlerDeps } from './base-command';
import { SeedGoogleAdsCommand } from './definitions/seed-google-ads.command';
import { GoogleAdsSeederService, SeederResult } from '../services/google-ads-seeder.service';
export interface ISeedGoogleAdsHandlerDeps extends IBaseCommandHandlerDeps {
    readonly seederService: GoogleAdsSeederService;
}
export declare class SeedGoogleAdsCommandHandler extends BaseCommandHandler<SeedGoogleAdsCommand, SeederResult> implements ICommandHandler<SeedGoogleAdsCommand, SeederResult> {
    readonly commandName: import("../core/contracts").CommandName;
    private readonly seederService;
    constructor(logger: ILogger, seederService: GoogleAdsSeederService);
    canHandle(command: unknown): command is SeedGoogleAdsCommand;
    getMetadata(): {
        name: import("../core/contracts").CommandName;
        displayName: string;
        description: string;
        icon: string;
        category: "data";
        estimatedDurationSeconds: number;
        risks: string[];
    };
    validate(command: SeedGoogleAdsCommand): Result<void>;
    protected executeCore(command: SeedGoogleAdsCommand, context: IExecutionContext): Promise<Result<SeederResult>>;
}
