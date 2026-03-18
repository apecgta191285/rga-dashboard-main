import { CommandPipelineResult } from '../manifest';
import { PrismaClient } from '@prisma/client';
import { IExecutionContext, Result } from './contracts';
export declare function shouldUseManifestSafety(commandName: string): boolean;
export declare function executeWithSafetyManifest<TResult>(params: {
    commandName: string;
    executionMode: 'CLI' | 'INTERNAL_API';
    context: IExecutionContext;
    prisma: PrismaClient;
    args?: Record<string, unknown>;
    skipSchemaParityPreflight?: boolean;
    execute: () => Promise<Result<TResult>>;
}): Promise<{
    result: Result<TResult>;
    pipeline: CommandPipelineResult | null;
}>;
