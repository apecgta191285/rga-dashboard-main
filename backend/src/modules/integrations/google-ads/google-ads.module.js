"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const axios_1 = require("@nestjs/axios");
const sync_module_1 = require("../../sync/sync.module");
const common_module_1 = require("../../../common/common.module");
const google_ads_auth_controller_1 = require("./google-ads-auth.controller");
const google_ads_campaign_controller_1 = require("./google-ads-campaign.controller");
const google_ads_integration_controller_1 = require("./google-ads-integration.controller");
const google_ads_oauth_service_1 = require("./google-ads-oauth.service");
const google_ads_campaign_service_1 = require("./google-ads-campaign.service");
const google_ads_client_service_1 = require("./services/google-ads-client.service");
const google_ads_api_service_1 = require("./services/google-ads-api.service");
const google_ads_mapper_service_1 = require("./services/google-ads-mapper.service");
const google_ads_service_1 = require("./google-ads.service");
const google_ads_sync_service_1 = require("./services/google-ads-sync.service");
const dashboard_module_1 = require("../../dashboard/dashboard.module");
let GoogleAdsModule = class GoogleAdsModule {
};
exports.GoogleAdsModule = GoogleAdsModule;
exports.GoogleAdsModule = GoogleAdsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            prisma_module_1.PrismaModule,
            axios_1.HttpModule,
            common_module_1.CommonModule,
            (0, common_1.forwardRef)(() => sync_module_1.SyncModule),
            dashboard_module_1.DashboardModule,
        ],
        controllers: [
            google_ads_auth_controller_1.GoogleAdsAuthController,
            google_ads_campaign_controller_1.GoogleAdsCampaignController,
            google_ads_integration_controller_1.GoogleAdsIntegrationController
        ],
        providers: [
            google_ads_oauth_service_1.GoogleAdsOAuthService,
            google_ads_campaign_service_1.GoogleAdsCampaignService,
            google_ads_client_service_1.GoogleAdsClientService,
            google_ads_api_service_1.GoogleAdsApiService,
            google_ads_mapper_service_1.GoogleAdsMapperService,
            google_ads_service_1.GoogleAdsService,
            google_ads_sync_service_1.GoogleAdsSyncService,
        ],
        exports: [
            google_ads_oauth_service_1.GoogleAdsOAuthService,
            google_ads_campaign_service_1.GoogleAdsCampaignService,
            google_ads_client_service_1.GoogleAdsClientService,
            google_ads_api_service_1.GoogleAdsApiService,
            google_ads_mapper_service_1.GoogleAdsMapperService,
            google_ads_service_1.GoogleAdsService,
            google_ads_sync_service_1.GoogleAdsSyncService,
        ],
    })
], GoogleAdsModule);
//# sourceMappingURL=google-ads.module.js.map