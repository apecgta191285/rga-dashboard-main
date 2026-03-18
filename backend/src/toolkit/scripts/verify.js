"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
const crypto_1 = require("crypto");
const core_1 = require("../core");
const infrastructure_1 = require("../infrastructure");
const command_registry_1 = require("../core/command-registry");
const verify_scenario_command_1 = require("../commands/verify-scenario.command");
const scenario_loader_1 = require("../scenarios/scenario-loader");
const fixture_provider_1 = require("../fixtures/fixture-provider");
const ops_logger_1 = require("../core/observability/ops-logger");
const ui_printer_1 = require("../core/observability/ui-printer");
const run_logger_1 = require("../core/observability/run-logger");
const path = __importStar(require("path"));
const output_path_policy_1 = require("../core/output-path-policy");
const verification_repository_1 = require("../../modules/verification/verification.repository");
const verification_service_1 = require("../../modules/verification/verification.service");
const alert_rule_evaluator_1 = require("../../modules/verification/rules/alert-rule.evaluator");
const report_writer_1 = require("../../modules/verification/report-writer");
async function main() {
    const args = process.argv.slice(2);
    const flags = {};
    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const parts = arg.substring(2).split('=');
            flags[parts[0]] = parts.length > 1 ? parts[1] : true;
        }
        else if (!flags['_positional']) {
            flags['_positional'] = arg;
        }
    });
    const scenarioId = flags['_positional'] || flags['scenario'];
    const tenantId = flags['tenant'];
    const dryRun = !flags['no-dry-run'];
    if (!scenarioId || !tenantId) {
        console.error('Usage: verify.ts <scenario-id> --tenant=<tenant-id> [--no-dry-run] [--output-dir=<dir>]');
        process.exit(2);
    }
    try {
        const config = (0, core_1.loadConfiguration)();
        (0, core_1.initializeContainer)(config);
        core_1.ServiceLocator.register(core_1.TOKENS.Logger, infrastructure_1.PinoLogger);
        core_1.ServiceLocator.register(core_1.TOKENS.CommandRegistry, command_registry_1.CommandRegistry);
        tsyringe_1.container.register(verify_scenario_command_1.VerifyScenarioCommandHandler, { useClass: verify_scenario_command_1.VerifyScenarioCommandHandler });
        tsyringe_1.container.register(scenario_loader_1.ScenarioLoader, { useClass: scenario_loader_1.ScenarioLoader });
        tsyringe_1.container.registerInstance(fixture_provider_1.FixtureProvider, new fixture_provider_1.FixtureProvider());
        const prismaClient = core_1.ServiceLocator.resolve(core_1.TOKENS.PrismaClient);
        const scenarioLoader = tsyringe_1.container.resolve(scenario_loader_1.ScenarioLoader);
        const verificationRepository = new verification_repository_1.VerificationRepository(prismaClient);
        const verificationService = new verification_service_1.VerificationService(verificationRepository, scenarioLoader, new alert_rule_evaluator_1.AlertRuleEvaluator());
        tsyringe_1.container.registerInstance(core_1.TOKENS.VerificationService, verificationService);
        tsyringe_1.container.registerInstance(core_1.TOKENS.ReportWriter, new report_writer_1.ReportWriter());
        const handler = tsyringe_1.container.resolve(verify_scenario_command_1.VerifyScenarioCommandHandler);
        const runId = (0, crypto_1.randomUUID)();
        const env = process.env.TOOLKIT_ENV === 'CI' ? 'CI' : 'LOCAL';
        const runLogger = new run_logger_1.RunLogger(new ui_printer_1.ConsoleUiPrinter(env), new ops_logger_1.PinoOpsLogger(env, { runId, command: 'verify-scenario', tenantId }));
        const context = core_1.ExecutionContextFactory.create({
            tenantId: (0, core_1.createTenantId)(tenantId),
            dryRun,
            verbose: true,
            runId,
            logger: runLogger.ops,
            printer: runLogger.printer,
        });
        const requestedOutputDir = flags['output-dir'] || path.join(process.cwd(), 'artifacts/reports');
        let outputDir;
        try {
            outputDir = (0, output_path_policy_1.resolveOutputDir)('report', requestedOutputDir);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Verification Error: ${message}`);
            process.exit(error instanceof output_path_policy_1.OutputPathPolicyError ? error.exitCode : 78);
            return;
        }
        const command = new verify_scenario_command_1.VerifyScenarioCommand({
            scenarioId,
            tenantId,
            dryRun,
            outputDir
        });
        console.log(`Starting verification for scenario: ${scenarioId} (Tenant: ${tenantId})`);
        if (dryRun)
            console.log('Mode: DRY-RUN (No artifacts will be written)');
        const result = await handler.execute(command, context);
        if (result.kind === 'success') {
            const { status, reportPath, summary } = result.value;
            console.log(`Verification Status: ${status}`);
            console.log(`Report: ${reportPath}`);
            if (status === 'FAIL')
                process.exit(10);
            if (status === 'PASS' || status === 'WARN')
                process.exit(0);
        }
        else {
            console.error(`Verification Error: ${result.error.message}`);
            process.exit(1);
        }
    }
    catch (e) {
        console.error('Fatal Error:', e.message);
        process.exit(1);
    }
    finally {
        await (0, core_1.disposeContainer)();
    }
}
main();
//# sourceMappingURL=verify.js.map