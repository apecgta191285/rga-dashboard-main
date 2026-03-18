"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldUseManifestSafety = shouldUseManifestSafety;
exports.executeWithSafetyManifest = executeWithSafetyManifest;
const manifest_1 = require("../manifest");
const contracts_1 = require("./contracts");
const write_schema_preflight_1 = require("./write-schema-preflight");
const MANIFEST_WRAPPED_COMMANDS = new Set([
    'seed-data',
    'seed-google-ads',
    'alert-scenario',
    'reset-tenant',
    'reset-tenant-hard',
    'seed-unified-scenario',
    'verify-scenario',
]);
class SafetyBlockedError extends contracts_1.ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'SAFETY_BLOCK';
        this.isRecoverable = false;
    }
}
class PipelineExecutionError extends contracts_1.ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'PIPELINE_EXECUTION_FAILED';
        this.isRecoverable = false;
    }
}
class SchemaParityBlockedError extends contracts_1.ToolkitError {
    constructor() {
        super(...arguments);
        this.code = 'SCHEMA_PARITY_VIOLATION';
        this.isRecoverable = false;
    }
}
function classifyCommand(commandName) {
    if (commandName === 'reset-tenant' || commandName === 'reset-tenant-hard') {
        return 'DESTRUCTIVE';
    }
    return 'WRITE';
}
function shouldUseManifestSafety(commandName) {
    return MANIFEST_WRAPPED_COMMANDS.has(commandName);
}
async function assertSchemaParityPreflight(prisma) {
    await (0, write_schema_preflight_1.assertToolkitWriteSchemaParity)(prisma);
}
async function executeWithSafetyManifest(params) {
    const { commandName, executionMode, context, args, execute, prisma, skipSchemaParityPreflight = false, } = params;
    if (!shouldUseManifestSafety(commandName)) {
        return { result: await execute(), pipeline: null };
    }
    let handlerResult = null;
    const pipeline = await (0, manifest_1.executeWithManifest)({
        config: {
            executionMode,
            commandName,
            commandClassification: classifyCommand(commandName),
            args: {
                tenantId: context.tenantId,
                ...args,
            },
            flags: {
                dryRun: context.dryRun,
                noDryRun: !context.dryRun,
                verbose: context.verbose,
            },
        },
        execute: async (builder) => {
            builder.setTenant({
                tenantId: context.tenantId,
                tenantSlug: null,
                tenantDisplayName: null,
                tenantResolution: 'EXPLICIT',
            });
            const preflightStep = builder.startStep('VALIDATE_INPUT');
            if (skipSchemaParityPreflight) {
                preflightStep.close({
                    status: 'SKIPPED',
                    summary: 'Schema parity preflight skipped by test override',
                });
            }
            else {
                try {
                    await assertSchemaParityPreflight(prisma);
                    preflightStep.close({
                        status: 'SUCCESS',
                        summary: 'Schema parity preflight passed',
                    });
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    const code = error instanceof write_schema_preflight_1.SchemaParityPreflightError
                        ? error.code
                        : 'SCHEMA_PARITY_VIOLATION';
                    preflightStep.close({
                        status: 'FAILED',
                        summary: message,
                        error: {
                            code,
                            message,
                            isRecoverable: false,
                        },
                    });
                    builder.addError({
                        code,
                        message,
                        isRecoverable: false,
                    });
                    return { status: 'BLOCKED', exitCode: 78 };
                }
            }
            const executeStep = builder.startStep('EXECUTE');
            try {
                handlerResult = await execute();
                if (handlerResult.kind === 'success') {
                    executeStep.close({
                        status: 'SUCCESS',
                        summary: 'Command completed successfully',
                    });
                    return { status: 'SUCCESS', exitCode: 0 };
                }
                executeStep.close({
                    status: 'FAILED',
                    summary: handlerResult.error.message,
                    error: {
                        code: handlerResult.error.code || 'COMMAND_FAILED',
                        message: handlerResult.error.message,
                        isRecoverable: Boolean(handlerResult.error.isRecoverable),
                    },
                });
                builder.addError(handlerResult.error);
                return { status: 'FAILED', exitCode: 1 };
            }
            catch (error) {
                builder.addError(error);
                executeStep.close({
                    status: 'FAILED',
                    summary: error instanceof Error ? error.message : String(error),
                    error: {
                        code: 'UNEXPECTED_ERROR',
                        message: error instanceof Error ? error.message : String(error),
                        isRecoverable: false,
                    },
                });
                return { status: 'FAILED', exitCode: 1 };
            }
        },
    });
    if (pipeline.status === 'BLOCKED') {
        const blockedStepSummary = pipeline.manifest?.steps
            ?.find((step) => step.status === 'FAILED')
            ?.summary;
        const blockedStepName = pipeline.manifest?.steps
            ?.find((step) => step.status === 'FAILED')
            ?.name;
        const reason = blockedStepSummary ?? 'Execution blocked by safety gate';
        if (blockedStepName === 'VALIDATE_INPUT') {
            return {
                result: contracts_1.Result.failure(new SchemaParityBlockedError(reason)),
                pipeline,
            };
        }
        return {
            result: contracts_1.Result.failure(new SafetyBlockedError(reason)),
            pipeline,
        };
    }
    if (handlerResult) {
        return { result: handlerResult, pipeline };
    }
    return {
        result: contracts_1.Result.failure(new PipelineExecutionError('Pipeline completed without command result')),
        pipeline,
    };
}
//# sourceMappingURL=safety-execution.js.map