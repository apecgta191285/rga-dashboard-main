"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
const crypto_1 = require("crypto");
const core_1 = require("../core");
const seed_unified_command_1 = require("../commands/seed-unified.command");
const seed_unified_command_2 = require("../commands/seed-unified.command");
const pino_logger_1 = require("../infrastructure/pino-logger");
const scenario_loader_1 = require("../scenarios/scenario-loader");
const fixture_provider_1 = require("../fixtures/fixture-provider");
const ops_logger_1 = require("../core/observability/ops-logger");
const ui_printer_1 = require("../core/observability/ui-printer");
const run_logger_1 = require("../core/observability/run-logger");
async function main() {
    process.env.TOOLKIT_ENV = 'CI';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    console.log('--- Initializing ---');
    const config = (0, core_1.loadConfiguration)();
    (0, core_1.initializeContainer)(config);
    core_1.ServiceLocator.register(core_1.TOKENS.Logger, pino_logger_1.PinoLogger);
    tsyringe_1.container.registerInstance(scenario_loader_1.ScenarioLoader, new scenario_loader_1.ScenarioLoader());
    tsyringe_1.container.registerInstance(fixture_provider_1.FixtureProvider, new fixture_provider_1.FixtureProvider());
    tsyringe_1.container.register(seed_unified_command_1.SeedUnifiedCommandHandler, { useClass: seed_unified_command_1.SeedUnifiedCommandHandler });
    const handler = tsyringe_1.container.resolve(seed_unified_command_1.SeedUnifiedCommandHandler);
    const runId = (0, crypto_1.randomUUID)();
    const env = process.env.TOOLKIT_ENV === 'CI' ? 'CI' : 'LOCAL';
    const runLogger = new run_logger_1.RunLogger(new ui_printer_1.ConsoleUiPrinter(env), new ops_logger_1.PinoOpsLogger(env, { runId, command: 'seed-unified-scenario', tenantId: 'tenant-evidence' }));
    const context = core_1.ExecutionContextFactory.create({
        tenantId: (0, core_1.createTenantId)('tenant-evidence'),
        verbose: true,
        runId,
        logger: runLogger.ops,
        printer: runLogger.printer,
    });
    console.log('\n--- Running SUCCESS Case ---');
    const cmdSuccess = new seed_unified_command_2.SeedUnifiedCommand({
        tenant: 'tenant-evidence',
        scenario: 'baseline',
        mode: 'GENERATED',
        seed: 12345,
        days: 1,
        dryRun: true,
        allowRealTenant: false
    });
    await handler.execute(cmdSuccess, context);
    console.log('\n--- Running BLOCKED Case ---');
    const cmdBlocked = new seed_unified_command_2.SeedUnifiedCommand({
        tenant: 'tenant-evidence',
        scenario: '../../../etc/passwd',
        mode: 'GENERATED',
        seed: 12345,
        days: 1,
        dryRun: true,
        allowRealTenant: false
    });
    await handler.execute(cmdBlocked, context);
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=prove-manifest.js.map