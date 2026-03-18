"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOLKIT_INTERNAL_PROVIDERS = void 0;
const prisma_service_1 = require("../../modules/prisma/prisma.service");
const alert_scenario_handler_1 = require("../commands/alert-scenario.handler");
const reset_tenant_handler_1 = require("../commands/reset-tenant.handler");
const command_registry_1 = require("../core/command-registry");
const core_1 = require("../core");
const ui_printer_1 = require("../core/observability/ui-printer");
const pino_logger_1 = require("../infrastructure/pino-logger");
const alert_engine_service_1 = require("../services/alert-engine.service");
const alert_scenario_service_1 = require("../services/alert-scenario.service");
const google_ads_seeder_service_1 = require("../services/google-ads-seeder.service");
const tenant_reset_service_1 = require("../services/tenant-reset.service");
const toolkit_internal_tokens_1 = require("./toolkit-internal.tokens");
const toolkitConfigProvider = {
    provide: toolkit_internal_tokens_1.TOOLKIT_INTERNAL_CONFIG,
    useFactory: () => (0, core_1.loadConfiguration)(),
};
const toolkitLoggerProvider = {
    provide: toolkit_internal_tokens_1.TOOLKIT_INTERNAL_LOGGER,
    useFactory: (config) => {
        return new pino_logger_1.PinoLogger(config);
    },
    inject: [toolkit_internal_tokens_1.TOOLKIT_INTERNAL_CONFIG],
};
const toolkitUiPrinterProvider = {
    provide: toolkit_internal_tokens_1.TOOLKIT_INTERNAL_UI_PRINTER,
    useFactory: () => new ui_printer_1.ConsoleUiPrinter('LOCAL'),
};
const toolkitGoogleAdsSeederServiceProvider = {
    provide: google_ads_seeder_service_1.GoogleAdsSeederService,
    useFactory: (logger, prisma) => {
        return new google_ads_seeder_service_1.GoogleAdsSeederService(logger, prisma);
    },
    inject: [toolkit_internal_tokens_1.TOOLKIT_INTERNAL_LOGGER, prisma_service_1.PrismaService],
};
const toolkitAlertEngineProvider = {
    provide: alert_engine_service_1.AlertEngine,
    useFactory: () => new alert_engine_service_1.AlertEngine(),
};
const toolkitAlertScenarioServiceProvider = {
    provide: alert_scenario_service_1.AlertScenarioService,
    useFactory: (seederService, alertEngine, prisma) => {
        return new alert_scenario_service_1.AlertScenarioService(seederService, alertEngine, prisma);
    },
    inject: [google_ads_seeder_service_1.GoogleAdsSeederService, alert_engine_service_1.AlertEngine, prisma_service_1.PrismaService],
};
const toolkitTenantResetServiceProvider = {
    provide: tenant_reset_service_1.TenantResetService,
    useFactory: (prisma) => {
        return new tenant_reset_service_1.TenantResetService(prisma);
    },
    inject: [prisma_service_1.PrismaService],
};
const toolkitAlertScenarioCommandHandlerProvider = {
    provide: alert_scenario_handler_1.AlertScenarioCommandHandler,
    useFactory: (logger, scenarioService) => {
        return new alert_scenario_handler_1.AlertScenarioCommandHandler(logger, scenarioService);
    },
    inject: [toolkit_internal_tokens_1.TOOLKIT_INTERNAL_LOGGER, alert_scenario_service_1.AlertScenarioService],
};
const toolkitResetTenantCommandHandlerProvider = {
    provide: reset_tenant_handler_1.ResetTenantCommandHandler,
    useFactory: (logger, resetService) => {
        return new reset_tenant_handler_1.ResetTenantCommandHandler(logger, resetService);
    },
    inject: [toolkit_internal_tokens_1.TOOLKIT_INTERNAL_LOGGER, tenant_reset_service_1.TenantResetService],
};
const toolkitResetTenantHardCommandHandlerProvider = {
    provide: reset_tenant_handler_1.ResetTenantHardCommandHandler,
    useFactory: (logger, resetService) => {
        return new reset_tenant_handler_1.ResetTenantHardCommandHandler(logger, resetService);
    },
    inject: [toolkit_internal_tokens_1.TOOLKIT_INTERNAL_LOGGER, tenant_reset_service_1.TenantResetService],
};
const toolkitCommandRegistryProvider = {
    provide: toolkit_internal_tokens_1.TOOLKIT_INTERNAL_COMMAND_REGISTRY,
    useFactory: (logger, alertHandler, resetHandler, hardResetHandler) => {
        const registry = new command_registry_1.CommandRegistry(logger);
        registry.register(alertHandler);
        registry.register(resetHandler);
        registry.register(hardResetHandler);
        return registry;
    },
    inject: [
        toolkit_internal_tokens_1.TOOLKIT_INTERNAL_LOGGER,
        alert_scenario_handler_1.AlertScenarioCommandHandler,
        reset_tenant_handler_1.ResetTenantCommandHandler,
        reset_tenant_handler_1.ResetTenantHardCommandHandler,
    ],
};
exports.TOOLKIT_INTERNAL_PROVIDERS = [
    toolkitConfigProvider,
    toolkitLoggerProvider,
    toolkitUiPrinterProvider,
    toolkitGoogleAdsSeederServiceProvider,
    toolkitAlertEngineProvider,
    toolkitAlertScenarioServiceProvider,
    toolkitTenantResetServiceProvider,
    toolkitAlertScenarioCommandHandlerProvider,
    toolkitResetTenantCommandHandlerProvider,
    toolkitResetTenantHardCommandHandlerProvider,
    toolkitCommandRegistryProvider,
];
//# sourceMappingURL=toolkit-internal.providers.js.map