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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TikTokAdsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokAdsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
let TikTokAdsService = TikTokAdsService_1 = class TikTokAdsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TikTokAdsService_1.name);
        this.baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';
    }
    async validateCredentials(credentials) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/advertiser/get/`, {
                headers: {
                    'Access-Token': credentials.accessToken,
                },
                params: {
                    app_id: this.configService.get('TIKTOK_APP_ID'),
                    advertiser_ids: JSON.stringify([credentials.accountId]),
                },
            });
            return response.data?.code === 0;
        }
        catch (error) {
            this.logger.error(`TikTok Credentials Validation Failed: ${error.message}`);
            return false;
        }
    }
    async fetchCampaigns(credentials) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/campaign/get/`, {
                headers: {
                    'Access-Token': credentials.accessToken,
                },
                params: {
                    advertiser_id: credentials.accountId,
                    page_size: 1000,
                },
            });
            if (response.data?.code !== 0) {
                throw new Error(`TikTok API Error: ${response.data?.message}`);
            }
            const campaigns = response.data.data.list || [];
            return campaigns.map((c) => ({
                externalId: c.campaign_id,
                name: c.campaign_name,
                status: this.mapStatus(c.operation_status),
                budget: new client_1.Prisma.Decimal(parseFloat(c.budget || '0')),
                platform: client_1.AdPlatform.TIKTOK,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to fetch TikTok campaigns: ${error.message}`);
            throw error;
        }
    }
    async fetchMetrics(credentials, campaignId, range) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/report/integrated/get/`, {
                headers: {
                    'Access-Token': credentials.accessToken,
                },
                params: {
                    advertiser_id: credentials.accountId,
                    report_type: 'BASIC',
                    data_level: 'AUCTION_CAMPAIGN',
                    dimensions: JSON.stringify(['campaign_id', 'stat_time_day']),
                    metrics: JSON.stringify([
                        'impressions',
                        'clicks',
                        'spend',
                        'conversion',
                    ]),
                    start_date: range.startDate.toISOString().split('T')[0],
                    end_date: range.endDate.toISOString().split('T')[0],
                    filters: JSON.stringify([
                        {
                            field_name: 'campaign_ids',
                            filter_type: 'IN',
                            filter_value: [campaignId],
                        },
                    ]),
                    page_size: 1000,
                },
            });
            if (response.data?.code !== 0) {
                throw new Error(`TikTok API Error: ${response.data?.message}`);
            }
            const list = response.data.data.list || [];
            return list.map((row) => ({
                date: new Date(row.metrics.stat_time_day),
                impressions: parseInt(row.metrics.impressions),
                clicks: parseInt(row.metrics.clicks),
                spend: new client_1.Prisma.Decimal(parseFloat(row.metrics.spend)),
                conversions: parseInt(row.metrics.conversion),
                revenue: new client_1.Prisma.Decimal(0),
                roas: new client_1.Prisma.Decimal(0),
            }));
        }
        catch (error) {
            this.logger.error(`Failed to fetch TikTok metrics: ${error.message}`);
            return [];
        }
    }
    mapStatus(status) {
        switch (status?.toUpperCase()) {
            case 'ENABLE':
            case 'ENABLED':
            case 'ACTIVE':
                return client_1.CampaignStatus.ACTIVE;
            case 'DISABLE':
            case 'DISABLED':
            case 'PAUSED':
                return client_1.CampaignStatus.PAUSED;
            default:
                return client_1.CampaignStatus.PAUSED;
        }
    }
};
exports.TikTokAdsService = TikTokAdsService;
exports.TikTokAdsService = TikTokAdsService = TikTokAdsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TikTokAdsService);
//# sourceMappingURL=tiktok-ads.service.js.map