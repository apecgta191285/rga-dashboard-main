"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyScenarioCommandHandler = exports.VerifyScenarioCommand = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const contracts_1 = require("../core/contracts");
const container_1 = require("../core/container");
const manifest_1 = require("../manifest");
const scenario_loader_1 = require("../scenarios/scenario-loader");
const verification_service_1 = require("../../modules/verification/verification.service");
const report_writer_1 = require("../../modules/verification/report-writer");
const output_path_policy_1 = require("../core/output-path-policy");
class VerifyScenarioCommand {
    constructor(params) {
        this.params = params;
        this.name = (0, contracts_1.createCommandName)('verify-scenario');
        this.description = 'Verify scenario data integrity and business rules';
        this.requiresConfirmation = false;
    }
}
exports.VerifyScenarioCommand = VerifyScenarioCommand;
class VerifyError extends contracts_1.ToolkitError {
    constructor(message, code = 'VERIFY_ERROR', isRecoverable = false) {
        super(message);
        this.code = code;
        this.isRecoverable = isRecoverable;
    }
}
let VerifyScenarioCommandHandler = class VerifyScenarioCommandHandler {
    constructor(logger, prisma, scenarioLoader, verificationService, reportWriter) {
        this.logger = logger;
        this.prisma = prisma;
        this.scenarioLoader = scenarioLoader;
        this.verificationService = verificationService;
        this.reportWriter = reportWriter;
    }
    getMetadata() {
        return {
            name: 'verify-scenario',
            displayName: 'Verify Scenario',
            description: 'Verifies data integrity and business rules for a seeded scenario',
            icon: '[V]',
            category: 'diagnostics',
            estimatedDurationSeconds: 5,
            risks: ['Read-only analysis', 'Writes report file to disk'],
        };
    }
    validate(command) {
        if (!command.params.scenarioId)
            return contracts_1.Result.failure(new VerifyError('Scenario ID is required'));
        if (!command.params.tenantId)
            return contracts_1.Result.failure(new VerifyError('Tenant ID is required'));
        return contracts_1.Result.success(undefined);
    }
    canHandle(command) {
        return command.name === 'verify-scenario';
    }
    async execute(command, context) {
        const params = {
            ...command.params,
            dryRun: context.dryRun,
        };
        const result = await this.runWithManifest(params);
        if (result.status === 'BLOCKED') {
            return contracts_1.Result.failure(new VerifyError(`Verification Failed with status ${result.status}`, 'VERIFY_BLOCKED'));
        }
        if (result.status === 'FAILED' && result.exitCode !== 10) {
            return contracts_1.Result.failure(new VerifyError(`Verification Command Failed with exit code ${result.exitCode}`, 'VERIFY_ERROR'));
        }
        const fsWrites = result.manifest?.results?.filesystemWrites?.pathsMasked || [];
        const reportPath = fsWrites[0] || 'unknown';
        const verifySummary = result.manifest?.steps?.find((step) => step.name === 'VERIFY')?.summary;
        const parsedSummary = this.parseVerifySummary(verifySummary);
        let verifyStatus = 'PASS';
        if (parsedSummary) {
            verifyStatus = parsedSummary.status;
        }
        else if (result.exitCode === 10) {
            verifyStatus = 'FAIL';
        }
        else if (result.manifest?.status === 'SUCCESS') {
            verifyStatus = 'PASS';
        }
        return contracts_1.Result.success({
            reportPath,
            status: verifyStatus,
            summary: parsedSummary,
        });
    }
    async runWithManifest(params, manifestDir) {
        return (0, manifest_1.executeWithManifest)({
            config: {
                executionMode: 'CLI',
                type: 'VERIFY',
                commandName: 'verify-scenario',
                commandClassification: 'READ',
                args: { ...params },
                flags: {
                    dryRun: Boolean(params.dryRun),
                    noDryRun: !params.dryRun,
                    force: false,
                    yes: false,
                    verbose: true,
                    manifestDir: manifestDir ?? null,
                    seed: null,
                    scenario: params.scenarioId,
                },
            },
            manifestDir,
            execute: async (builder) => {
                return this.executeCore(builder, params);
            },
        });
    }
    async executeCore(builder, params) {
        const { scenarioId, tenantId, outputDir, dryRun } = params;
        const manifestTenant = await this.resolveTenantForManifest(tenantId);
        builder.setTenant(manifestTenant);
        if (manifestTenant.tenantResolution === 'FAILED') {
            builder.addWarning(`Tenant metadata lookup failed for tenantId=${tenantId}.`);
        }
        const loadStep = builder.startStep('LOAD_SCENARIO');
        try {
            await this.scenarioLoader.load(scenarioId);
            loadStep.close({ status: 'SUCCESS', summary: `Loaded scenario ${scenarioId}` });
        }
        catch (e) {
            loadStep.close({ status: 'FAILED', summary: e.message, error: { code: 'LOAD_FAIL', message: e.message, isRecoverable: false } });
            return { status: 'BLOCKED', exitCode: 2 };
        }
        const verifyStep = builder.startStep('VERIFY');
        let reportFile = '';
        let verifyResult;
        try {
            verifyResult = await this.verificationService.verifyScenario({
                scenarioId,
                tenantId,
                runId: builder.getRunId(),
            });
            if (verifyResult.summary.status === 'WARN') {
                builder.addWarning(`Verification returned WARN (${verifyResult.summary.warnings} warning checks, 0 failures).`);
            }
            verifyStep.close({
                status: verifyResult.summary.status === 'FAIL' ? 'FAILED' : 'SUCCESS',
                summary: `Verification ${verifyResult.summary.status}: ${verifyResult.summary.passed} passed, ${verifyResult.summary.failed} failed, ${verifyResult.summary.warnings} warnings.`,
                metrics: {
                    recordsAffectedActual: 0,
                    recordsAffectedEstimate: 0,
                    entitiesTouched: [],
                }
            });
        }
        catch (e) {
            verifyStep.close({ status: 'FAILED', summary: e.message, error: { code: 'sys-err', message: e.message, isRecoverable: false } });
            return { status: 'FAILED', exitCode: 1 };
        }
        const reportStep = builder.startStep('EXECUTE');
        try {
            if (!dryRun) {
                const out = outputDir || (0, output_path_policy_1.getDefaultOutputRoot)('report');
                reportFile = await this.reportWriter.writeReport(verifyResult, out);
                reportStep.close({
                    status: 'SUCCESS',
                    summary: `Written report to ${reportFile}`
                });
                builder.setResults({
                    filesystemWrites: { count: 1, pathsMasked: [reportFile] }
                });
            }
            else {
                reportStep.close({ status: 'SKIPPED', summary: 'Dry run - report write skipped' });
            }
        }
        catch (e) {
            reportStep.close({ status: 'FAILED', summary: e.message });
            return { status: 'FAILED', exitCode: 1 };
        }
        const finalStatus = verifyResult.summary.status === 'FAIL' ? 'FAILED' : 'SUCCESS';
        const finalExitCode = verifyResult.summary.status === 'FAIL' ? 10 : 0;
        return { status: finalStatus, exitCode: finalExitCode };
    }
    async resolveTenantForManifest(tenantId) {
        try {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true, slug: true, name: true },
            });
            if (!tenant) {
                return {
                    tenantId,
                    tenantSlug: null,
                    tenantDisplayName: null,
                    tenantResolution: 'FAILED',
                };
            }
            return {
                tenantId: tenant.id,
                tenantSlug: tenant.slug ?? null,
                tenantDisplayName: tenant.name ?? null,
                tenantResolution: 'EXPLICIT',
            };
        }
        catch {
            return {
                tenantId,
                tenantSlug: null,
                tenantDisplayName: null,
                tenantResolution: 'FAILED',
            };
        }
    }
    parseVerifySummary(summaryText) {
        if (!summaryText) {
            return null;
        }
        const match = summaryText.match(/^Verification (PASS|FAIL|WARN):\s*(\d+)\s+passed,\s*(\d+)\s+failed,\s*(\d+)\s+warnings\.?$/i);
        if (!match) {
            return null;
        }
        return {
            status: match[1].toUpperCase(),
            passed: Number.parseInt(match[2], 10),
            failed: Number.parseInt(match[3], 10),
            warnings: Number.parseInt(match[4], 10),
        };
    }
};
exports.VerifyScenarioCommandHandler = VerifyScenarioCommandHandler;
exports.VerifyScenarioCommandHandler = VerifyScenarioCommandHandler = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(container_1.TOKENS.Logger)),
    __param(1, (0, tsyringe_1.inject)(container_1.TOKENS.PrismaClient)),
    __param(2, (0, tsyringe_1.inject)(scenario_loader_1.ScenarioLoader)),
    __param(3, (0, tsyringe_1.inject)(container_1.TOKENS.VerificationService)),
    __param(4, (0, tsyringe_1.inject)(container_1.TOKENS.ReportWriter)),
    __metadata("design:paramtypes", [Object, client_1.PrismaClient,
        scenario_loader_1.ScenarioLoader,
        verification_service_1.VerificationService,
        report_writer_1.ReportWriter])
], VerifyScenarioCommandHandler);
//# sourceMappingURL=verify-scenario.command.js.map