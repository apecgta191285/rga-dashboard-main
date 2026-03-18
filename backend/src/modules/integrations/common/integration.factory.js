"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationFactory = void 0;
const common_1 = require("@nestjs/common");
const google_ads_service_1 = require("../google-ads/google-ads.service");
const facebook_ads_service_1 = require("../facebook/facebook-ads.service");
const google_analytics_adapter_service_1 = require("../google-analytics/google-analytics-adapter.service");
const tiktok_ads_service_1 = require("../tiktok/tiktok-ads.service");
const line_ads_adapter_service_1 = require("../line-ads/line-ads-adapter.service");
const client_1 = require("@prisma/client");
let IntegrationFactory = class IntegrationFactory {
    constructor(googleAdsService, facebookAdsService, googleAnalyticsAdapterService, tiktokAdsService, lineAdsAdapterService) {
        this.googleAdsService = googleAdsService;
        this.facebookAdsService = facebookAdsService;
        this.googleAnalyticsAdapterService = googleAnalyticsAdapterService;
        this.tiktokAdsService = tiktokAdsService;
        this.lineAdsAdapterService = lineAdsAdapterService;
    }
    getAdapter(platform) {
        const normalizedPlatform = typeof platform === 'string'
            ? platform.toUpperCase()
            : platform;
        switch (normalizedPlatform) {
            case client_1.AdPlatform.GOOGLE_ADS:
            case 'GOOGLE_ADS':
                return this.googleAdsService;
            case client_1.AdPlatform.FACEBOOK:
            case 'FACEBOOK':
                return this.facebookAdsService;
            case 'INSTAGRAM':
                return this.facebookAdsService;
            case client_1.AdPlatform.GOOGLE_ANALYTICS:
            case 'GOOGLE_ANALYTICS':
                return this.googleAnalyticsAdapterService;
            case client_1.AdPlatform.TIKTOK:
            case 'TIKTOK':
                return this.tiktokAdsService;
            case client_1.AdPlatform.LINE_ADS:
            case 'LINE_ADS':
                return this.lineAdsAdapterService;
            default:
                throw new common_1.NotImplementedException(`Platform ${platform} not supported`);
        }
    }
};
exports.IntegrationFactory = IntegrationFactory;
exports.IntegrationFactory = IntegrationFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [google_ads_service_1.GoogleAdsService,
        facebook_ads_service_1.FacebookAdsService,
        google_analytics_adapter_service_1.GoogleAnalyticsAdapterService,
        tiktok_ads_service_1.TikTokAdsService,
        line_ads_adapter_service_1.LineAdsAdapterService])
], IntegrationFactory);
//# sourceMappingURL=integration.factory.js.map