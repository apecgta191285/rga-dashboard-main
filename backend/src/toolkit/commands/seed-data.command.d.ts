import { PrismaClient } from '@prisma/client';
import { IExecutionContext, Result, CommandName, ILogger, ICommand, ICommandHandler } from '../core/contracts';
import { ToolkitPlatform } from '../domain/platform.types';
import { GoogleAdsSeederService } from '../services';
export interface SeedDataCommandParams {
    platform: ToolkitPlatform;
    days: number;
    trend: 'GROWTH' | 'DECLINE' | 'STABLE';
    injectAnomaly: boolean;
}
export declare class SeedDataCommand implements ICommand {
    readonly params: SeedDataCommandParams;
    readonly name: CommandName;
    readonly description = "Seed mock metric data for a specific platform";
    readonly requiresConfirmation = true;
    constructor(params: SeedDataCommandParams);
}
export interface SeedDataResult {
    platform: ToolkitPlatform;
    campaignId: string;
    recordsCreated: number;
    dateRange: {
        start: Date;
        end: Date;
    };
    anomalyInjected: boolean;
}
export declare class SeedDataCommandHandler implements ICommandHandler<SeedDataCommand> {
    private readonly logger;
    private readonly prisma;
    private readonly seeder;
    private readonly engine;
    constructor(logger: ILogger, prisma: PrismaClient, seeder: GoogleAdsSeederService);
    canHandle(command: ICommand): command is SeedDataCommand;
    execute(command: SeedDataCommand, context: IExecutionContext): Promise<Result<SeedDataResult>>;
    getMetadata(): {
        name: string;
        displayName: string;
        description: string;
        icon: string;
        category: "data";
        estimatedDurationSeconds: number;
        risks: string[];
    };
    validate(command: SeedDataCommand): Result<void>;
    private findOrCreateCampaign;
    private injectAnomaly;
    private manualSeed;
}
