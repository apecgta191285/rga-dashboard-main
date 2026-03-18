"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const sync_scheduler_service_1 = require("./sync-scheduler.service");
const unified_sync_service_1 = require("./unified-sync.service");
const prisma_module_1 = require("../prisma/prisma.module");
const config_1 = require("@nestjs/config");
const google_analytics_module_1 = require("../integrations/google-analytics/google-analytics.module");
const google_ads_module_1 = require("../integrations/google-ads/google-ads.module");
const facebook_ads_module_1 = require("../integrations/facebook/facebook-ads.module");
const tiktok_ads_module_1 = require("../integrations/tiktok/tiktok-ads.module");
const line_ads_module_1 = require("../integrations/line-ads/line-ads.module");
const integration_factory_1 = require("../integrations/common/integration.factory");
const sync_controller_1 = require("./sync.controller");
let SyncModule = class SyncModule {
};
exports.SyncModule = SyncModule;
exports.SyncModule = SyncModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            config_1.ConfigModule,
            (0, common_1.forwardRef)(() => google_analytics_module_1.GoogleAnalyticsModule),
            (0, common_1.forwardRef)(() => google_ads_module_1.GoogleAdsModule),
            facebook_ads_module_1.FacebookAdsModule,
            tiktok_ads_module_1.TikTokAdsModule,
            line_ads_module_1.LineAdsModule,
        ],
        controllers: [sync_controller_1.SyncController],
        providers: [
            sync_scheduler_service_1.SyncSchedulerService,
            unified_sync_service_1.UnifiedSyncService,
            integration_factory_1.IntegrationFactory,
        ],
        exports: [
            sync_scheduler_service_1.SyncSchedulerService,
            unified_sync_service_1.UnifiedSyncService,
        ],
    })
], SyncModule);
//# sourceMappingURL=sync.module.js.map