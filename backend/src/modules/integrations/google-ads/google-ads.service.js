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
var GoogleAdsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const google_ads_campaign_service_1 = require("./google-ads-campaign.service");
let GoogleAdsService = GoogleAdsService_1 = class GoogleAdsService {
    constructor(campaignService) {
        this.campaignService = campaignService;
        this.logger = new common_1.Logger(GoogleAdsService_1.name);
    }
    async validateCredentials(credentials) {
        return true;
    }
    async fetchCampaigns(credentials) {
        this.logger.log(`Fetching Google Ads campaigns for account ${credentials.accountId}`);
        try {
            const result = await this.campaignService.fetchCampaigns(credentials.accountId);
            return result.campaigns.map((c) => ({
                externalId: String(c.externalId ?? c.id ?? ''),
                name: c.name,
                status: c.status,
                platform: client_1.AdPlatform.GOOGLE_ADS,
                budget: new client_1.Prisma.Decimal(c.budget ?? 0),
                startDate: c.startDate ?? null,
                endDate: c.endDate ?? null,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to fetch campaigns: ${error.message}`);
            throw error;
        }
    }
    async fetchMetrics(credentials, campaignId, range) {
        this.logger.log(`Fetching metrics for campaign ${campaignId}`);
        try {
            const metrics = await this.campaignService.fetchCampaignMetrics(credentials.accountId, campaignId, range.startDate, range.endDate);
            return metrics.map((m) => {
                const spend = m.spend ?? m.cost ?? 0;
                const revenue = m.revenue ?? m.conversionValue ?? 0;
                const spendNum = typeof spend === 'number' ? spend : Number(spend);
                const revenueNum = typeof revenue === 'number' ? revenue : Number(revenue);
                const roasNum = spendNum > 0 ? revenueNum / spendNum : 0;
                return {
                    date: m.date,
                    impressions: m.impressions ?? 0,
                    clicks: m.clicks ?? 0,
                    conversions: Math.trunc(m.conversions ?? 0),
                    spend: new client_1.Prisma.Decimal(spendNum || 0),
                    revenue: new client_1.Prisma.Decimal(revenueNum || 0),
                    roas: new client_1.Prisma.Decimal(roasNum),
                };
            });
        }
        catch (error) {
            this.logger.error(`Failed to fetch metrics: ${error.message}`);
            return [];
        }
    }
};
exports.GoogleAdsService = GoogleAdsService;
exports.GoogleAdsService = GoogleAdsService = GoogleAdsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [google_ads_campaign_service_1.GoogleAdsCampaignService])
], GoogleAdsService);
//# sourceMappingURL=google-ads.service.js.map