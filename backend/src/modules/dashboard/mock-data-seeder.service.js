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
var MockDataSeederService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDataSeederService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MockDataSeederService = MockDataSeederService_1 = class MockDataSeederService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MockDataSeederService_1.name);
    }
    generateDailyMetrics() {
        const baseImpressions = Math.floor(Math.random() * 5000) + 1000;
        const ctr = 0.02 + Math.random() * 0.03;
        const clicks = Math.floor(baseImpressions * ctr);
        const spend = Math.floor(Math.random() * 500) + 100;
        const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.03));
        const revenue = conversions * (50 + Math.random() * 100);
        const cpc = clicks > 0 ? spend / clicks : 0;
        const cpm = baseImpressions > 0 ? (spend / baseImpressions) * 1000 : 0;
        const roas = spend > 0 ? revenue / spend : 0;
        return {
            impressions: baseImpressions,
            clicks,
            spend,
            conversions,
            revenue,
            ctr: ctr * 100,
            cpc,
            cpm,
            roas,
        };
    }
    async seedCampaignMetrics(campaignId, days = 30) {
        this.logger.log(`Seeding ${days} days of mock metrics for campaign ${campaignId}`);
        let createdCount = 0;
        let skippedCount = 0;
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        const startDateUTC = new Date(todayUTC);
        startDateUTC.setUTCDate(startDateUTC.getUTCDate() - days);
        const currentDate = new Date(startDateUTC);
        while (currentDate <= todayUTC) {
            const dateKey = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 0, 0, 0, 0));
            const existing = await this.prisma.metric.findFirst({
                where: {
                    campaignId,
                    date: dateKey,
                },
            });
            if (existing) {
                skippedCount++;
            }
            else {
                const dailyMock = this.generateDailyMetrics();
                const campaign = await this.prisma.campaign.findUnique({
                    where: { id: campaignId },
                    select: { tenantId: true, platform: true },
                });
                if (campaign) {
                    await this.prisma.metric.create({
                        data: {
                            tenantId: campaign.tenantId,
                            campaignId,
                            platform: campaign.platform,
                            date: dateKey,
                            impressions: dailyMock.impressions,
                            clicks: dailyMock.clicks,
                            spend: dailyMock.spend,
                            conversions: dailyMock.conversions,
                            revenue: dailyMock.revenue,
                            roas: dailyMock.roas,
                            isMockData: true,
                        },
                    });
                }
                createdCount++;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        this.logger.log(`Seeded ${createdCount} mock metrics (${skippedCount} skipped) for campaign ${campaignId}`);
        return {
            success: true,
            createdCount,
            skippedCount,
            campaignId,
        };
    }
    async seedAccountMetrics(accountId, days = 90) {
        this.logger.log(`Seeding mock metrics for all campaigns in account ${accountId}`);
        const campaigns = await this.prisma.campaign.findMany({
            where: { googleAdsAccountId: accountId },
            select: { id: true, name: true },
        });
        let totalMetricsCreated = 0;
        for (const campaign of campaigns) {
            const result = await this.seedCampaignMetrics(campaign.id, days);
            totalMetricsCreated += result.createdCount;
        }
        this.logger.log(`Account ${accountId}: Seeded ${totalMetricsCreated} total mock metrics for ${campaigns.length} campaigns`);
        return {
            success: true,
            totalCampaigns: campaigns.length,
            totalMetricsCreated,
        };
    }
    async hasCampaignMetrics(campaignId) {
        const count = await this.prisma.metric.count({
            where: { campaignId },
        });
        return count > 0;
    }
    async needsSeeding(campaignId, days = 90) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const count = await this.prisma.metric.count({
            where: {
                campaignId,
                date: { gte: startDate },
            },
        });
        return count === 0;
    }
    generateGA4DailyMetrics() {
        const activeUsers = Math.floor(Math.random() * 1000) + 100;
        const newUsers = Math.floor(activeUsers * (0.3 + Math.random() * 0.2));
        const sessions = Math.floor(activeUsers * (1.2 + Math.random() * 0.5));
        const screenPageViews = Math.floor(sessions * (2 + Math.random() * 3));
        const engagementRate = 0.4 + Math.random() * 0.3;
        const bounceRate = 1 - engagementRate;
        const avgSessionDuration = 60 + Math.random() * 180;
        return {
            activeUsers,
            newUsers,
            sessions,
            screenPageViews,
            engagementRate,
            bounceRate,
            avgSessionDuration,
        };
    }
    async seedGA4Metrics(tenantId, propertyId, days = 30) {
        this.logger.log(`Seeding ${days} days of mock GA4 metrics for property ${propertyId}`);
        let createdCount = 0;
        let skippedCount = 0;
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        const startDateUTC = new Date(todayUTC);
        startDateUTC.setUTCDate(startDateUTC.getUTCDate() - days);
        const currentDate = new Date(startDateUTC);
        while (currentDate <= todayUTC) {
            const dateKey = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), 0, 0, 0, 0));
            const existing = await this.prisma.webAnalyticsDaily.findFirst({
                where: {
                    tenantId,
                    propertyId,
                    date: dateKey,
                },
            });
            if (existing) {
                skippedCount++;
            }
            else {
                const dailyMock = this.generateGA4DailyMetrics();
                await this.prisma.webAnalyticsDaily.create({
                    data: {
                        tenantId,
                        propertyId,
                        date: dateKey,
                        ...dailyMock,
                        isMockData: true,
                    },
                });
                createdCount++;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        this.logger.log(`Seeded ${createdCount} mock GA4 metrics (${skippedCount} skipped) for property ${propertyId}`);
        return {
            success: true,
            createdCount,
            skippedCount,
        };
    }
};
exports.MockDataSeederService = MockDataSeederService;
exports.MockDataSeederService = MockDataSeederService = MockDataSeederService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MockDataSeederService);
//# sourceMappingURL=mock-data-seeder.service.js.map