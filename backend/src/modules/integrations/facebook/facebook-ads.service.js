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
var FacebookAdsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookAdsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const prisma_service_1 = require("../../prisma/prisma.service");
const rxjs_1 = require("rxjs");
const client_1 = require("@prisma/client");
let FacebookAdsService = FacebookAdsService_1 = class FacebookAdsService {
    constructor(prisma, config, httpService) {
        this.prisma = prisma;
        this.config = config;
        this.httpService = httpService;
        this.logger = new common_1.Logger(FacebookAdsService_1.name);
        this.apiVersion = this.config.get('FACEBOOK_API_VERSION', 'v18.0');
        this.baseUrl = this.config.get('FACEBOOK_API_BASE_URL', 'https://graph.facebook.com');
    }
    async validateCredentials(credentials) {
        try {
            const url = `${this.baseUrl}/${this.apiVersion}/me`;
            await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                params: { access_token: credentials.accessToken },
            }));
            return true;
        }
        catch (error) {
            this.logger.error(`Credential validation failed: ${error.message}`);
            return false;
        }
    }
    async fetchCampaigns(credentials) {
        this.logger.log(`Fetching Facebook campaigns for account ${credentials.accountId}`);
        try {
            const url = `${this.baseUrl}/${this.apiVersion}/${credentials.accountId}/campaigns`;
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                params: {
                    access_token: credentials.accessToken,
                    fields: 'id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget',
                    limit: 100,
                },
            }));
            const campaigns = data.data.map((c) => ({
                externalId: c.id,
                name: c.name,
                status: this.mapStatus(c.status),
                platform: client_1.AdPlatform.FACEBOOK,
                budget: new client_1.Prisma.Decimal(c.daily_budget
                    ? Number(c.daily_budget) / 100
                    : (c.lifetime_budget ? Number(c.lifetime_budget) / 100 : 0)),
                startDate: c.start_time ? new Date(c.start_time) : null,
                endDate: c.stop_time ? new Date(c.stop_time) : null,
            }));
            return campaigns;
        }
        catch (error) {
            this.logger.error(`Failed to fetch campaigns: ${error.message}`);
            throw error;
        }
    }
    async fetchMetrics(credentials, campaignId, range) {
        this.logger.log(`Fetching metrics for campaign ${campaignId}`);
        try {
            const url = `${this.baseUrl}/${this.apiVersion}/${campaignId}/insights`;
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
                params: {
                    access_token: credentials.accessToken,
                    fields: 'impressions,clicks,spend,conversions,purchase_roas,actions',
                    time_range: {
                        since: range.startDate.toISOString().split('T')[0],
                        until: range.endDate.toISOString().split('T')[0],
                    },
                    time_increment: 1,
                    breakdowns: 'publisher_platform',
                },
            }));
            const metrics = data.data.map((m) => {
                const spend = Number(m.spend) || 0;
                const revenue = m.purchase_roas ? (spend * Number(m.purchase_roas[0]?.value || 0)) : 0;
                const impressions = Number(m.impressions) || 0;
                const clicks = Number(m.clicks) || 0;
                const publisherPlatform = (m.publisher_platform || '').toLowerCase();
                const platform = publisherPlatform === 'instagram'
                    ? 'INSTAGRAM'
                    : client_1.AdPlatform.FACEBOOK;
                return {
                    date: new Date(m.date_start),
                    platform,
                    impressions,
                    clicks,
                    spend: new client_1.Prisma.Decimal(spend),
                    conversions: Math.trunc(Number(m.conversions?.[0]?.value || 0)),
                    revenue: new client_1.Prisma.Decimal(revenue),
                    roas: new client_1.Prisma.Decimal(spend > 0 ? revenue / spend : 0),
                };
            });
            return metrics;
        }
        catch (error) {
            this.logger.error(`Failed to fetch metrics: ${error.message}`);
            throw error;
        }
    }
    async exchangeToken(shortLivedToken) {
        return shortLivedToken;
    }
    mapStatus(fbStatus) {
        switch (fbStatus?.toUpperCase()) {
            case 'ACTIVE':
                return client_1.CampaignStatus.ACTIVE;
            case 'PAUSED':
                return client_1.CampaignStatus.PAUSED;
            case 'DELETED':
            case 'ARCHIVED':
                return client_1.CampaignStatus.DELETED;
            default:
                return client_1.CampaignStatus.PAUSED;
        }
    }
};
exports.FacebookAdsService = FacebookAdsService;
exports.FacebookAdsService = FacebookAdsService = FacebookAdsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        axios_1.HttpService])
], FacebookAdsService);
//# sourceMappingURL=facebook-ads.service.js.map