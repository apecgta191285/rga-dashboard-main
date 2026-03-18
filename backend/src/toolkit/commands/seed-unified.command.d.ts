import { PrismaClient } from '@prisma/client';
import { ICommand, ICommandHandler, ICommandMetadata, IExecutionContext, Result, ILogger } from '../core/contracts';
import type { CommandPipelineResult } from '../manifest';
import { ScenarioLoader } from '../scenarios/scenario-loader';
import { FixtureProvider } from '../fixtures/fixture-provider';
export type ExecutionMode = 'GENERATED' | 'FIXTURE' | 'HYBRID';
export interface SeedUnifiedCommandParams {
    tenant: string;
    scenario: string;
    mode: ExecutionMode;
    seed: number;
    days?: number;
    platforms?: string;
    dryRun: boolean;
    allowRealTenant?: boolean;
}
export declare class SeedUnifiedCommand implements ICommand {
    readonly params: SeedUnifiedCommandParams;
    readonly name: import("../core/contracts").CommandName;
    readonly description = "Deterministic multi-platform seeding with strict provenance";
    readonly requiresConfirmation = true;
    constructor(params: SeedUnifiedCommandParams);
}
export interface SeedUnifiedResult {
    rowsCreated: number;
    platformsProcessed: string[];
    sourceTag: string;
    manifestPath: string | null;
    manifest: any;
}
export declare class SeedUnifiedCommandHandler implements ICommandHandler<SeedUnifiedCommand> {
    private readonly logger;
    private readonly prisma;
    private readonly scenarioLoader;
    private readonly fixtureProvider;
    private readonly engine;
    constructor(logger: ILogger, prisma: PrismaClient, scenarioLoader: ScenarioLoader, fixtureProvider: FixtureProvider);
    getMetadata(): ICommandMetadata;
    validate(command: SeedUnifiedCommand): Result<void>;
    canHandle(command: ICommand): command is SeedUnifiedCommand;
    execute(command: SeedUnifiedCommand, context: IExecutionContext): Promise<Result<SeedUnifiedResult>>;
    runWithManifest(params: SeedUnifiedCommandParams, manifestDir?: string): Promise<CommandPipelineResult>;
    private executeCore;
    private enforceHygiene;
    private ensureSchemaParity;
    private resolveTargetPlatforms;
    private shapesEqual;
    private computeShapeChecksum;
    private deepSortKeys;
}
