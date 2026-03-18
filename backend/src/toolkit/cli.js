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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const inquirer_1 = __importDefault(require("inquirer"));
const util = __importStar(require("node:util"));
const manifest_1 = require("./manifest");
const Redactor = __importStar(require("./manifest/redactor"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const tsyringe_1 = require("tsyringe");
const core_1 = require("./core");
const infrastructure_1 = require("./infrastructure");
const command_registry_1 = require("./core/command-registry");
const services_1 = require("./services");
const commands_1 = require("./commands");
const scenario_loader_1 = require("./scenarios/scenario-loader");
const fixture_provider_1 = require("./fixtures/fixture-provider");
const verification_repository_1 = require("../modules/verification/verification.repository");
const verification_service_1 = require("../modules/verification/verification.service");
const alert_rule_evaluator_1 = require("../modules/verification/rules/alert-rule.evaluator");
const report_writer_1 = require("../modules/verification/report-writer");
const seed_data_ui_1 = require("./commands/ui/seed-data.ui");
const seed_google_ads_ui_1 = require("./commands/ui/seed-google-ads.ui");
const alert_scenario_ui_1 = require("./commands/ui/alert-scenario.ui");
const reset_tenant_ui_1 = require("./commands/ui/reset-tenant.ui");
const reset_tenant_hard_ui_1 = require("./commands/ui/reset-tenant-hard.ui");
const seed_unified_ui_1 = require("./commands/ui/seed-unified.ui");
const verify_scenario_ui_1 = require("./commands/ui/verify-scenario.ui");
const prompts_1 = require("./commands/ui/prompts");
const ACTION_CHANGE_TENANT = '__CHANGE_TENANT__';
const ACTION_PREFLIGHT = '__PREFLIGHT__';
const ACTION_EXIT = '__EXIT__';
const REQUIRED_NODE_MAJOR = 20;
function assertSupportedNodeVersion(requiredMajor) {
    const detected = process.versions.node || '';
    const major = Number.parseInt(detected.split('.')[0] || '', 10);
    if (!Number.isFinite(major) || major < requiredMajor) {
        console.error(chalk_1.default.red(`Unsupported Node.js runtime ${detected}. ` +
            `Toolkit CLI requires Node ${requiredMajor}+ (see .nvmrc).`));
        process.exit(1);
    }
}
async function main() {
    assertSupportedNodeVersion(REQUIRED_NODE_MAJOR);
    installProcessHandlers();
    console.clear();
    console.log(chalk_1.default.cyan.bold(`
=================================================================
${chalk_1.default.white.bold('RGA Dev Toolkit')} (v2.0 - Modular)
${chalk_1.default.gray('Production-Grade Developer CLI')}
=================================================================
`));
    const { values, positionals } = util.parseArgs({
        args: process.argv.slice(2),
        options: {
            tenant: { type: 'string', short: 't' },
            headless: { type: 'boolean' },
            nonInteractive: { type: 'boolean' },
            dryRun: { type: 'boolean' },
            scenario: { type: 'string' },
            mode: { type: 'string' },
            seed: { type: 'string' },
            days: { type: 'string' },
            platforms: { type: 'string' },
            allowReal: { type: 'string' },
        },
        allowPositionals: true,
        strict: false
    });
    const targetCommand = positionals[0];
    const isHeadless = values.headless || values.nonInteractive || !!targetCommand;
    const spinner = (0, ora_1.default)('Initializing...').start();
    let config;
    try {
        config = (0, core_1.loadConfiguration)();
        spinner.succeed('Configuration loaded');
    }
    catch (error) {
        spinner.fail('Configuration error');
        console.error(chalk_1.default.red(Redactor.sanitizeError(error).message));
        process.exit(1);
    }
    spinner.start('Initializing services...');
    try {
        (0, core_1.initializeContainer)(config);
        core_1.ServiceLocator.register(core_1.TOKENS.Logger, infrastructure_1.PinoLogger);
        tsyringe_1.container.register(core_1.TOKENS.SessionStore, { useFactory: () => new infrastructure_1.FileSessionStore() });
        core_1.ServiceLocator.register(core_1.TOKENS.CommandRegistry, command_registry_1.CommandRegistry);
        tsyringe_1.container.register(services_1.GoogleAdsSeederService, { useClass: services_1.GoogleAdsSeederService });
        tsyringe_1.container.register(services_1.AlertEngine, { useClass: services_1.AlertEngine });
        tsyringe_1.container.register(services_1.AlertScenarioService, { useClass: services_1.AlertScenarioService });
        tsyringe_1.container.register(services_1.TenantResetService, { useClass: services_1.TenantResetService });
        tsyringe_1.container.register(commands_1.SeedDataCommandHandler, { useClass: commands_1.SeedDataCommandHandler });
        tsyringe_1.container.register(commands_1.SeedGoogleAdsCommandHandler, { useClass: commands_1.SeedGoogleAdsCommandHandler });
        tsyringe_1.container.register(commands_1.AlertScenarioCommandHandler, { useClass: commands_1.AlertScenarioCommandHandler });
        tsyringe_1.container.register(commands_1.ResetTenantCommandHandler, { useClass: commands_1.ResetTenantCommandHandler });
        tsyringe_1.container.register(commands_1.ResetTenantHardCommandHandler, { useClass: commands_1.ResetTenantHardCommandHandler });
        tsyringe_1.container.register(commands_1.SeedUnifiedCommandHandler, { useClass: commands_1.SeedUnifiedCommandHandler });
        tsyringe_1.container.register(commands_1.VerifyScenarioCommandHandler, { useClass: commands_1.VerifyScenarioCommandHandler });
        tsyringe_1.container.register(scenario_loader_1.ScenarioLoader, { useClass: scenario_loader_1.ScenarioLoader });
        tsyringe_1.container.registerInstance(fixture_provider_1.FixtureProvider, new fixture_provider_1.FixtureProvider());
        const prismaClient = core_1.ServiceLocator.resolve(core_1.TOKENS.PrismaClient);
        const scenarioLoader = tsyringe_1.container.resolve(scenario_loader_1.ScenarioLoader);
        const verificationRepository = new verification_repository_1.VerificationRepository(prismaClient);
        const verificationService = new verification_service_1.VerificationService(verificationRepository, scenarioLoader, new alert_rule_evaluator_1.AlertRuleEvaluator());
        tsyringe_1.container.registerInstance(core_1.TOKENS.VerificationService, verificationService);
        tsyringe_1.container.registerInstance(core_1.TOKENS.ReportWriter, new report_writer_1.ReportWriter());
        const registry = core_1.ServiceLocator.resolve(core_1.TOKENS.CommandRegistry);
        const seedDataHandler = tsyringe_1.container.resolve(commands_1.SeedDataCommandHandler);
        const seedGoogleAdsHandler = tsyringe_1.container.resolve(commands_1.SeedGoogleAdsCommandHandler);
        const alertScenarioHandler = tsyringe_1.container.resolve(commands_1.AlertScenarioCommandHandler);
        const resetTenantHandler = tsyringe_1.container.resolve(commands_1.ResetTenantCommandHandler);
        const resetTenantHardHandler = tsyringe_1.container.resolve(commands_1.ResetTenantHardCommandHandler);
        const seedUnifiedHandler = tsyringe_1.container.resolve(commands_1.SeedUnifiedCommandHandler);
        const verifyScenarioHandler = tsyringe_1.container.resolve(commands_1.VerifyScenarioCommandHandler);
        registry.register(seedUnifiedHandler);
        registry.register(verifyScenarioHandler);
        registry.register(seedDataHandler);
        registry.register(seedGoogleAdsHandler);
        registry.register(alertScenarioHandler);
        registry.register(resetTenantHandler);
        registry.register(resetTenantHardHandler);
        spinner.succeed('Services initialized');
    }
    catch (error) {
        spinner.fail('Initialization error');
        console.error(chalk_1.default.red(Redactor.sanitizeError(error).message));
        process.exit(1);
    }
    const uiRegistry = new Map();
    const registerUi = (ui) => uiRegistry.set(ui.name, ui);
    registerUi(new seed_unified_ui_1.SeedUnifiedUi());
    registerUi(new verify_scenario_ui_1.VerifyScenarioUi());
    registerUi(new seed_data_ui_1.SeedDataUi());
    registerUi(new seed_google_ads_ui_1.SeedGoogleAdsUi());
    registerUi(new alert_scenario_ui_1.AlertScenarioUi());
    registerUi(new reset_tenant_ui_1.ResetTenantUi());
    registerUi(new reset_tenant_hard_ui_1.ResetTenantHardUi());
    const sessionStore = core_1.ServiceLocator.resolve(core_1.TOKENS.SessionStore);
    const prisma = core_1.ServiceLocator.resolve(core_1.TOKENS.PrismaClient);
    let tenantId = values.tenant;
    if (!tenantId) {
        tenantId = (await sessionStore.getLastTenantId());
    }
    if (targetCommand) {
        if (!uiRegistry.has(targetCommand)) {
            console.error(chalk_1.default.red(`Error: Unknown command "${targetCommand}"`));
            console.log('Available commands:', Array.from(uiRegistry.keys()).join(', '));
            await (0, core_1.disposeContainer)();
            process.exit(1);
        }
        if (!tenantId) {
            console.error(chalk_1.default.red('Error: Tenant ID is required. Use --tenant <id> or set a default.'));
            await (0, core_1.disposeContainer)();
            process.exit(1);
        }
        const ui = uiRegistry.get(targetCommand);
        try {
            await ui.execute(tenantId, core_1.ServiceLocator.resolve(core_1.TOKENS.CommandRegistry), values);
            await (0, core_1.disposeContainer)();
            process.exit(0);
        }
        catch (error) {
            console.error(chalk_1.default.red(`\nCommand execution failed: ${Redactor.sanitizeError(error).message}\n`));
            await (0, core_1.disposeContainer)();
            process.exit(1);
        }
    }
    let continueLoop = true;
    while (continueLoop) {
        const registry = core_1.ServiceLocator.resolve(core_1.TOKENS.CommandRegistry);
        const commands = registry.listAll();
        const choices = [
            ...commands.map(({ command, handler }) => ({
                name: `${handler.getMetadata().displayName}${['seed-unified-scenario', 'verify-scenario'].includes(command.name)
                    ? ' (Recommended)'
                    : ''}`,
                value: command.name,
            })),
            new inquirer_1.default.Separator(chalk_1.default.gray('-'.repeat(45))),
            { name: '[Preflight] Toolkit Preflight (GO/NO-GO)', value: ACTION_PREFLIGHT },
            { name: '[Tenant] Change Tenant', value: ACTION_CHANGE_TENANT },
            { name: '[Exit] Exit', value: ACTION_EXIT },
        ];
        const { action } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: tenantId
                    ? `What would you like to do? (Tenant: ${chalk_1.default.cyan(tenantId)})`
                    : 'Select an action:',
                choices,
                pageSize: 12,
            },
        ]);
        if (action === ACTION_EXIT) {
            continueLoop = false;
            console.log(chalk_1.default.cyan('\nGoodbye!\n'));
            break;
        }
        if (action === ACTION_PREFLIGHT) {
            await runPreflightAndDisplay(prisma);
            continue;
        }
        if (action === ACTION_CHANGE_TENANT) {
            tenantId = await (0, prompts_1.promptForTenant)(prisma);
            if (tenantId) {
                await sessionStore.setLastTenantId(tenantId);
            }
            continue;
        }
        if (!tenantId) {
            console.log(chalk_1.default.yellow('\nWARNING: Please select a tenant first\n'));
            tenantId = await (0, prompts_1.promptForTenant)(prisma);
            if (tenantId) {
                await sessionStore.setLastTenantId(tenantId);
            }
            continue;
        }
        if (uiRegistry.has(action)) {
            const ui = uiRegistry.get(action);
            try {
                await ui.execute(tenantId, registry);
            }
            catch (error) {
                console.error(chalk_1.default.red(`\nCommand execution failed: ${Redactor.sanitizeError(error).message}\n`));
            }
        }
        else {
            console.log(chalk_1.default.yellow(`\nWARNING: Command "${action}" implemented in registry but missing UI handler.\n`));
        }
    }
    await (0, core_1.disposeContainer)();
    process.exit(0);
}
async function runPreflightAndDisplay(prisma) {
    const spinner = (0, ora_1.default)('Running toolkit preflight checks...').start();
    try {
        const result = await (0, core_1.runToolkitPreflight)(prisma, { requiredNodeMajor: 20 });
        spinner.stop();
        console.log(chalk_1.default.cyan('\nToolkit Preflight Summary'));
        for (const check of result.checks) {
            const icon = check.status === 'PASS' ? chalk_1.default.green('PASS') : chalk_1.default.red('FAIL');
            console.log(`- ${icon} ${check.id}: ${check.message}`);
        }
        console.log(chalk_1.default.cyan('\nRecommended Actions'));
        for (const action of result.actions) {
            console.log(`- ${action}`);
        }
        console.log(result.ok
            ? chalk_1.default.green('\nGO: Toolkit environment is ready.\n')
            : chalk_1.default.red('\nNO-GO: Fix failed checks before running write commands.\n'));
    }
    catch (error) {
        spinner.fail('Preflight failed unexpectedly');
        console.log(chalk_1.default.red(Redactor.sanitizeError(error).message));
    }
    await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'continue',
            message: chalk_1.default.gray('Press Enter to continue...'),
        },
    ]);
}
let processHandlersInstalled = false;
function installProcessHandlers() {
    if (processHandlersInstalled)
        return;
    processHandlersInstalled = true;
    process.on('SIGINT', () => {
        (0, manifest_1.emergencyFinalizeAndWrite)('SIGINT');
        console.error('\n[cli] SIGINT received - exiting with code 130');
        process.exit(130);
    });
    process.on('uncaughtException', (err) => {
        console.error(`[cli] uncaughtException: ${Redactor.sanitizeError(err).message}`);
        (0, manifest_1.emergencyFinalizeAndWrite)('uncaughtException');
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        const msg = Redactor.sanitizeError(reason).message;
        console.error(`[cli] unhandledRejection: ${msg}`);
        (0, manifest_1.emergencyFinalizeAndWrite)('unhandledRejection');
        process.exit(1);
    });
}
main().catch(async (error) => {
    console.error(chalk_1.default.red('Fatal error:'), Redactor.sanitizeError(error).message);
    await (0, core_1.disposeContainer)();
    process.exit(1);
});
//# sourceMappingURL=cli.js.map