"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const google_analytics_service_1 = require("./google-analytics.service");
const google_analytics_auth_controller_1 = require("./google-analytics-auth.controller");
const google_analytics_data_controller_1 = require("./google-analytics-data.controller");
const google_analytics_oauth_service_1 = require("./google-analytics-oauth.service");
const google_analytics_api_service_1 = require("./google-analytics-api.service");
const google_analytics_adapter_service_1 = require("./google-analytics-adapter.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const config_1 = require("@nestjs/config");
const dashboard_module_1 = require("../../dashboard/dashboard.module");
const sync_module_1 = require("../../sync/sync.module");
let GoogleAnalyticsModule = class GoogleAnalyticsModule {
};
exports.GoogleAnalyticsModule = GoogleAnalyticsModule;
exports.GoogleAnalyticsModule = GoogleAnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            dashboard_module_1.DashboardModule,
            config_1.ConfigModule,
            (0, common_1.forwardRef)(() => sync_module_1.SyncModule),
        ],
        controllers: [google_analytics_auth_controller_1.GoogleAnalyticsAuthController, google_analytics_data_controller_1.GoogleAnalyticsDataController],
        providers: [google_analytics_service_1.GoogleAnalyticsService, google_analytics_oauth_service_1.GoogleAnalyticsOAuthService, google_analytics_api_service_1.GoogleAnalyticsApiService, google_analytics_adapter_service_1.GoogleAnalyticsAdapterService],
        exports: [google_analytics_service_1.GoogleAnalyticsService, google_analytics_api_service_1.GoogleAnalyticsApiService, google_analytics_adapter_service_1.GoogleAnalyticsAdapterService],
    })
], GoogleAnalyticsModule);
//# sourceMappingURL=google-analytics.module.js.map