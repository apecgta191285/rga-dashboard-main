"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokAdsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const tiktok_ads_service_1 = require("./tiktok-ads.service");
const tiktok_ads_oauth_service_1 = require("./tiktok-ads-oauth.service");
const tiktok_ads_controller_1 = require("./tiktok-ads.controller");
const tiktok_ads_integration_controller_1 = require("./tiktok-ads-integration.controller");
let TikTokAdsModule = class TikTokAdsModule {
};
exports.TikTokAdsModule = TikTokAdsModule;
exports.TikTokAdsModule = TikTokAdsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            prisma_module_1.PrismaModule,
        ],
        controllers: [
            tiktok_ads_controller_1.TikTokAdsController,
            tiktok_ads_integration_controller_1.TikTokAdsIntegrationController,
        ],
        providers: [
            tiktok_ads_service_1.TikTokAdsService,
            tiktok_ads_oauth_service_1.TikTokAdsOAuthService,
        ],
        exports: [
            tiktok_ads_service_1.TikTokAdsService,
            tiktok_ads_oauth_service_1.TikTokAdsOAuthService,
        ],
    })
], TikTokAdsModule);
//# sourceMappingURL=tiktok-ads.module.js.map