import { ManifestBuilder, ManifestInitConfig } from './manifest-builder';
import { ManifestDocument, ManifestStatus, ExitCode, ManifestSafety } from './types';
export declare function getActiveBuilder(): ManifestBuilder | null;
export declare function emergencyFinalizeAndWrite(signal: string): void;
export interface SafetyCheckResult {
    safety: ManifestSafety;
    blocked: boolean;
    blockedGate: string | null;
    blockedReason: string | null;
}
export declare function evaluateSafetyGates(options?: {
    toolkitEnv?: string;
    databaseUrl?: string;
    safeDbHosts?: string[];
}): SafetyCheckResult;
export interface CommandPipelineOptions {
    config: ManifestInitConfig;
    execute: (builder: ManifestBuilder) => Promise<{
        status: ManifestStatus;
        exitCode: ExitCode;
    }>;
    safetyOptions?: Parameters<typeof evaluateSafetyGates>[0];
    manifestDir?: string;
    skipSafety?: boolean;
}
export interface CommandPipelineResult {
    status: ManifestStatus;
    exitCode: ExitCode;
    manifestPath: string | null;
    manifest: ManifestDocument;
}
export declare function executeWithManifest(options: CommandPipelineOptions): Promise<CommandPipelineResult>;
