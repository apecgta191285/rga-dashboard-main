import { ManifestDocument, ManifestSafety, ManifestTenant, ManifestResults, ManifestStatus, ManifestFlags, ManifestConfirmation, ExitCode, ExecutionMode, StepName, StepStatus, StepMetrics, SanitizedError, CommandClassification } from './types';
export interface IStepHandle {
    close(params: {
        status: StepStatus;
        summary: string;
        metrics?: StepMetrics;
        error?: SanitizedError;
    }): void;
}
export interface ManifestInitConfig {
    readonly runId?: string;
    readonly type?: string;
    readonly executionMode: ExecutionMode;
    readonly commandName: string;
    readonly commandClassification: CommandClassification;
    readonly args?: Record<string, unknown>;
    readonly flags?: Partial<ManifestFlags>;
}
export declare class ManifestBuilder {
    private runId;
    private readonly startedAt;
    private readonly startMs;
    private executionMode;
    private tty;
    private type?;
    private runtime;
    private status;
    private exitCode;
    private invocation;
    private safety;
    private tenant;
    private steps;
    private stepCounter;
    private results;
    private finalized;
    constructor(config: ManifestInitConfig);
    getRunId(): string;
    setSafety(safety: ManifestSafety): void;
    setTenant(tenant: ManifestTenant): void;
    setConfirmation(confirmation: ManifestConfirmation): void;
    setResults(results: Partial<ManifestResults>): void;
    addWarning(warning: string): void;
    addError(error: unknown): void;
    startStep(name: StepName): IStepHandle;
    finalize(status: ManifestStatus, exitCode: ExitCode): ManifestDocument;
    emergencyFinalize(): ManifestDocument;
    isFinalized(): boolean;
    private buildDocument;
}
