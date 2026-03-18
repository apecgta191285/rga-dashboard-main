"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookAdsModule = void 0;
const common_1 = require("@nestjs/common");
const facebook_ads_service_1 = require("./facebook-ads.service");
const facebook_ads_auth_controller_1 = require("./facebook-ads-auth.controller");
const facebook_ads_integration_controller_1 = require("./facebook-ads-integration.controller");
const facebook_ads_oauth_service_1 = require("./facebook-ads-oauth.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
let FacebookAdsModule = class FacebookAdsModule {
};
exports.FacebookAdsModule = FacebookAdsModule;
exports.FacebookAdsModule = FacebookAdsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, config_1.ConfigModule, axios_1.HttpModule],
        providers: [facebook_ads_service_1.FacebookAdsService, facebook_ads_oauth_service_1.FacebookAdsOAuthService],
        exports: [facebook_ads_service_1.FacebookAdsService, facebook_ads_oauth_service_1.FacebookAdsOAuthService],
        controllers: [facebook_ads_auth_controller_1.FacebookAdsAuthController, facebook_ads_integration_controller_1.FacebookAdsIntegrationController],
    })
], FacebookAdsModule);
//# sourceMappingURL=facebook-ads.module.js.map