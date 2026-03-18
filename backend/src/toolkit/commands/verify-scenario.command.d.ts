import { PrismaClient } from '@prisma/client';
import { ICommand, ICommandHandler, ICommandMetadata, IExecutionContext, Result, ILogger } from '../core/contracts';
import { CommandPipelineResult } from '../manifest';
import { ScenarioLoader } from '../scenarios/scenario-loader';
import { VerificationService } from '../../modules/verification/verification.service';
import { ReportWriter } from '../../modules/verification/report-writer';
import { VerificationSummary } from '../../modules/verification/types';
export interface VerifyScenarioParams {
    scenarioId: string;
    tenantId: string;
    runId?: string;
    outputDir?: string;
    dryRun?: boolean;
}
export declare class VerifyScenarioCommand implements ICommand {
    readonly params: VerifyScenarioParams;
    readonly name: import("../core/contracts").CommandName;
    readonly description = "Verify scenario data integrity and business rules";
    readonly requiresConfirmation = false;
    constructor(params: VerifyScenarioParams);
}
export interface VerifyScenarioResult {
    reportPath: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    summary: VerifyScenarioSummary | null;
}
export interface VerifyScenarioSummary {
    status: VerificationSummary['status'];
    passed: number;
    failed: number;
    warnings: number;
}
export declare class VerifyScenarioCommandHandler implements ICommandHandler<VerifyScenarioCommand> {
    private readonly logger;
    private readonly prisma;
    private readonly scenarioLoader;
    private readonly verificationService;
    private readonly reportWriter;
    constructor(logger: ILogger, prisma: PrismaClient, scenarioLoader: ScenarioLoader, verificationService: VerificationService, reportWriter: ReportWriter);
    getMetadata(): ICommandMetadata;
    validate(command: VerifyScenarioCommand): Result<void>;
    canHandle(command: ICommand): command is VerifyScenarioCommand;
    execute(command: VerifyScenarioCommand, context: IExecutionContext): Promise<Result<VerifyScenarioResult>>;
    runWithManifest(params: VerifyScenarioParams, manifestDir?: string): Promise<CommandPipelineResult>;
    private executeCore;
    private resolveTenantForManifest;
    private parseVerifySummary;
}
