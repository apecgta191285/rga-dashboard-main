"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const dashboard_controller_1 = require("./dashboard.controller");
const export_controller_1 = require("./export.controller");
const dashboard_service_1 = require("./dashboard.service");
const prisma_module_1 = require("../prisma/prisma.module");
const metrics_service_1 = require("./metrics.service");
const export_service_1 = require("./export.service");
const mock_data_seeder_service_1 = require("./mock-data-seeder.service");
const integration_switch_service_1 = require("../data-sources/integration-switch.service");
const integration_error_handler_1 = require("../integrations/common/integration-error.handler");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [dashboard_controller_1.DashboardController, export_controller_1.ExportController],
        providers: [
            dashboard_service_1.DashboardService,
            metrics_service_1.MetricsService,
            export_service_1.ExportService,
            mock_data_seeder_service_1.MockDataSeederService,
            integration_switch_service_1.IntegrationSwitchService,
            integration_error_handler_1.IntegrationErrorHandler
        ],
        exports: [
            dashboard_service_1.DashboardService,
            metrics_service_1.MetricsService,
            export_service_1.ExportService,
            mock_data_seeder_service_1.MockDataSeederService,
            integration_switch_service_1.IntegrationSwitchService
        ],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map