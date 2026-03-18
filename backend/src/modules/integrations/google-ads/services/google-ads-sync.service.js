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
var GoogleAdsSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const mock_data_seeder_service_1 = require("../../../dashboard/mock-data-seeder.service");
const google_ads_api_service_1 = require("./google-ads-api.service");
const google_ads_mapper_service_1 = require("./google-ads-mapper.service");
const client_1 = require("@prisma/client");
let GoogleAdsSyncService = GoogleAdsSyncService_1 = class GoogleAdsSyncService {
    constructor(prisma, googleAdsApiService, googleAdsMapperService, mockDataSeeder) {
        this.prisma = prisma;
        this.googleAdsApiService = googleAdsApiService;
        this.googleAdsMapperService = googleAdsMapperService;
        this.mockDataSeeder = mockDataSeeder;
        this.logger = new common_1.Logger(GoogleAdsSyncService_1.name);
    }
    async syncCampaigns(accountId) {
        const account = await this.prisma.googleAdsAccount.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            throw new Error('Google Ads account not found');
        }
        const results = await this.googleAdsApiService.fetchCampaigns(account);
        const campaigns = this.googleAdsMapperService.transformCampaigns(results);
        const syncedCampaigns = [];
        let createdCount = 0;
        let updatedCount = 0;
        this.logger.log(`Syncing ${campaigns.length} campaigns for account ${accountId}`);
        for (const campaign of campaigns) {
            const existing = await this.prisma.campaign.findFirst({
                where: {
                    externalId: campaign.externalId,
                    platform: 'GOOGLE_ADS',
                    tenantId: account.tenantId,
                },
            });
            if (existing) {
                const updated = await this.prisma.campaign.update({
                    where: { id: existing.id },
                    data: {
                        name: campaign.name,
                        status: campaign.status,
                        googleAdsAccount: {
                            connect: { id: accountId },
                        },
                    },
                });
                syncedCampaigns.push(updated);
                updatedCount++;
            }
            else {
                const created = await this.prisma.campaign.create({
                    data: {
                        name: campaign.name,
                        platform: 'GOOGLE_ADS',
                        status: campaign.status,
                        externalId: campaign.externalId,
                        googleAdsAccount: {
                            connect: { id: accountId },
                        },
                        tenant: {
                            connect: { id: account.tenantId },
                        },
                    },
                });
                syncedCampaigns.push(created);
                createdCount++;
            }
        }
        this.logger.log(`Campaign sync result: ${createdCount} created, ${updatedCount} updated`);
        await this.syncAllCampaignMetrics(accountId);
        return {
            synced: syncedCampaigns.length,
            campaigns: syncedCampaigns,
            createdCount,
            updatedCount,
        };
    }
    async syncCampaignMetrics(accountId, campaignId, days = 30) {
        this.logger.log(`Syncing metrics for campaign ${campaignId} (last ${days} days)`);
        const campaign = await this.prisma.campaign.findFirst({
            where: {
                id: campaignId,
                googleAdsAccountId: accountId,
            },
        });
        if (!campaign) {
            throw new common_1.NotFoundException(`Campaign ${campaignId} not found for account ${accountId}`);
        }
        if (!campaign.externalId) {
            throw new Error(`Campaign ${campaignId} has no externalId (Google Ads ID)`);
        }
        const account = await this.prisma.googleAdsAccount.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Google Ads account not found: ${accountId}`);
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
        const rawMetrics = await this.googleAdsApiService.fetchCampaignMetrics(account, campaign.externalId, startDate, endDate);
        const metricsData = this.googleAdsMapperService.transformMetrics(rawMetrics);
        let syncedCount = 0;
        let createdCount = 0;
        let updatedCount = 0;
        for (const metric of metricsData) {
            try {
                const roas = metric.cost > 0 ? metric.conversionValue / metric.cost : 0;
                const metricDataToSave = {
                    impressions: metric.impressions,
                    clicks: metric.clicks,
                    spend: metric.cost,
                    conversions: Math.round(metric.conversions),
                    revenue: metric.conversionValue,
                    roas: roas,
                    isMockData: false,
                };
                const existing = await this.prisma.metric.findFirst({
                    where: {
                        campaignId: campaign.id,
                        date: metric.date,
                    },
                });
                if (existing) {
                    await this.prisma.metric.update({
                        where: { id: existing.id },
                        data: metricDataToSave,
                    });
                    updatedCount++;
                }
                else {
                    await this.prisma.metric.create({
                        data: {
                            tenantId: campaign.tenantId,
                            campaignId: campaign.id,
                            platform: client_1.AdPlatform.GOOGLE_ADS,
                            date: metric.date,
                            ...metricDataToSave,
                        },
                    });
                    createdCount++;
                }
                syncedCount++;
            }
            catch (error) {
                this.logger.error(`Error syncing metric for date ${metric.date.toISOString()}: ${error.message}`);
            }
        }
        await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: { lastSyncedAt: new Date() },
        });
        this.logger.log(`Metrics sync completed: ${syncedCount} total, ${createdCount} created, ${updatedCount} updated`);
        return {
            success: true,
            campaignId: campaign.id,
            campaignName: campaign.name,
            syncedCount,
            createdCount,
            updatedCount,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            lastSyncedAt: new Date(),
        };
    }
    async syncAllCampaignMetrics(accountId, days = 90) {
        this.logger.log(`Syncing metrics for all campaigns in account ${accountId}`);
        const account = await this.prisma.googleAdsAccount.findUnique({
            where: { id: accountId },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Google Ads account not found: ${accountId}`);
        }
        const campaigns = await this.prisma.campaign.findMany({
            where: {
                googleAdsAccountId: accountId,
                externalId: { not: null },
            },
        });
        this.logger.log(`Found ${campaigns.length} campaigns to sync`);
        const syncPromises = campaigns.map(campaign => this.syncCampaignMetrics(accountId, campaign.id, days)
            .then(result => ({ success: true, ...result }))
            .catch(error => ({
            success: false,
            campaignId: campaign.id,
            campaignName: campaign.name,
            error: error.message,
        })));
        const results = await Promise.all(syncPromises);
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
        if (errorCount > 0) {
            this.logger.warn(`${errorCount} campaigns failed to sync metrics`);
        }
        await this.prisma.googleAdsAccount.update({
            where: { id: accountId },
            data: { lastSyncAt: new Date() },
        });
        return {
            success: true,
            accountId,
            totalCampaigns: campaigns.length,
            successCount,
            errorCount,
            results,
            lastSyncedAt: new Date(),
        };
    }
};
exports.GoogleAdsSyncService = GoogleAdsSyncService;
exports.GoogleAdsSyncService = GoogleAdsSyncService = GoogleAdsSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        google_ads_api_service_1.GoogleAdsApiService,
        google_ads_mapper_service_1.GoogleAdsMapperService,
        mock_data_seeder_service_1.MockDataSeederService])
], GoogleAdsSyncService);
//# sourceMappingURL=google-ads-sync.service.js.map