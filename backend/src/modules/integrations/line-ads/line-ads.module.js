"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineAdsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const line_ads_adapter_service_1 = require("./line-ads-adapter.service");
const line_ads_oauth_service_1 = require("./line-ads-oauth.service");
const line_ads_controller_1 = require("./line-ads.controller");
const line_ads_integration_controller_1 = require("./line-ads-integration.controller");
let LineAdsModule = class LineAdsModule {
};
exports.LineAdsModule = LineAdsModule;
exports.LineAdsModule = LineAdsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule],
        providers: [line_ads_adapter_service_1.LineAdsAdapterService, line_ads_oauth_service_1.LineAdsOAuthService],
        controllers: [line_ads_controller_1.LineAdsController, line_ads_integration_controller_1.LineAdsIntegrationController],
        exports: [line_ads_adapter_service_1.LineAdsAdapterService],
    })
], LineAdsModule);
//# sourceMappingURL=line-ads.module.js.map