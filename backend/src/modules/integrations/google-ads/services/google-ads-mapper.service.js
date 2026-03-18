"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsMapperService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GoogleAdsMapperService = class GoogleAdsMapperService {
    mapCampaignStatus(googleStatus) {
        if (typeof googleStatus === 'string') {
            const statusMap = {
                ENABLED: client_1.CampaignStatus.ACTIVE,
                PAUSED: client_1.CampaignStatus.PAUSED,
                REMOVED: client_1.CampaignStatus.DELETED,
            };
            return statusMap[googleStatus] || client_1.CampaignStatus.PAUSED;
        }
        switch (googleStatus) {
            case 2:
                return client_1.CampaignStatus.ACTIVE;
            case 3:
                return client_1.CampaignStatus.PAUSED;
            case 4:
                return client_1.CampaignStatus.DELETED;
            default:
                return client_1.CampaignStatus.PENDING;
        }
    }
    transformCampaigns(results) {
        return results.map((row) => ({
            externalId: row.campaign.id.toString(),
            name: row.campaign.name,
            status: this.mapCampaignStatus(row.campaign.status),
            platform: client_1.AdPlatform.GOOGLE_ADS,
            channelType: row.campaign.advertising_channel_type,
            metrics: {
                clicks: row.metrics?.clicks || 0,
                impressions: row.metrics?.impressions || 0,
                cost: (row.metrics?.cost_micros || 0) / 1000000,
                conversions: row.metrics?.conversions || 0,
                ctr: row.metrics?.ctr || 0,
            },
            budget: 0,
        }));
    }
    transformMetrics(metrics) {
        return metrics.map((row) => ({
            date: new Date(row.segments.date),
            campaignId: row.campaign.id.toString(),
            campaignName: row.campaign.name,
            impressions: parseInt(row.metrics?.impressions || '0'),
            clicks: parseInt(row.metrics?.clicks || '0'),
            cost: (row.metrics?.cost_micros || 0) / 1000000,
            conversions: parseFloat(row.metrics?.conversions || '0'),
            conversionValue: parseFloat(row.metrics?.conversions_value || '0'),
            ctr: parseFloat(row.metrics?.ctr || '0') * 100,
            cpc: (row.metrics?.average_cpc || 0) / 1000000,
            cpm: 0,
        }));
    }
};
exports.GoogleAdsMapperService = GoogleAdsMapperService;
exports.GoogleAdsMapperService = GoogleAdsMapperService = __decorate([
    (0, common_1.Injectable)()
], GoogleAdsMapperService);
//# sourceMappingURL=google-ads-mapper.service.js.map