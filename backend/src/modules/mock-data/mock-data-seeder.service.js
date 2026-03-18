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
const metrics_generator_1 = require("./generators/metrics.generator");
const alerts_generator_1 = require("./generators/alerts.generator");
const sync_logs_generator_1 = require("./generators/sync-logs.generator");
const mock_campaigns_1 = require("./data/mock-campaigns");
const client_1 = require("@prisma/client");
let MockDataSeederService = MockDataSeederService_1 = class MockDataSeederService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MockDataSeederService_1.name);
    }
    async seedCampaignMetrics(campaignId, days = 30) {
        this.logger.log(`Seeding ${days} days of mock metrics for campaign ${campaignId}`);
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { tenantId: true, platform: true },
        });
        if (!campaign) {
            throw new Error(`Campaign ${campaignId} not found`);
        }
        let createdCount = 0;
        let skippedCount = 0;
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const startDateUTC = new Date(todayUTC);
        startDateUTC.setUTCDate(startDateUTC.getUTCDate() - days);
        const currentDate = new Date(startDateUTC);
        while (currentDate <= todayUTC) {
            const dateKey = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
            const existing = await this.prisma.metric.findFirst({
                where: { campaignId, date: dateKey },
            });
            if (existing) {
                skippedCount++;
            }
            else {
                const dailyMock = (0, metrics_generator_1.generateDailyAdMetrics)();
                await this.prisma.metric.create({
                    data: {
                        tenantId: campaign.tenantId,
                        campaignId,
                        date: dateKey,
                        platform: campaign.platform,
                        impressions: dailyMock.impressions,
                        clicks: dailyMock.clicks,
                        spend: dailyMock.spend,
                        conversions: dailyMock.conversions,
                        revenue: dailyMock.revenue,
                        roas: dailyMock.roas,
                        isMockData: true,
                    },
                });
                createdCount++;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        this.logger.log(`Seeded ${createdCount} mock metrics (${skippedCount} skipped) for campaign ${campaignId}`);
        return { success: true, createdCount, skippedCount, campaignId };
    }
    async seedGA4Metrics(tenantId, propertyId, days = 30) {
        this.logger.log(`Seeding ${days} days of mock GA4 metrics for property ${propertyId}`);
        let createdCount = 0;
        let skippedCount = 0;
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const startDateUTC = new Date(todayUTC);
        startDateUTC.setUTCDate(startDateUTC.getUTCDate() - days);
        const currentDate = new Date(startDateUTC);
        while (currentDate <= todayUTC) {
            const dateKey = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
            const existing = await this.prisma.webAnalyticsDaily.findFirst({
                where: { tenantId, propertyId, date: dateKey },
            });
            if (existing) {
                skippedCount++;
            }
            else {
                const dailyMock = (0, metrics_generator_1.generateDailyGA4Metrics)();
                await this.prisma.webAnalyticsDaily.create({
                    data: { tenantId, propertyId, date: dateKey, ...dailyMock, isMockData: true },
                });
                createdCount++;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        this.logger.log(`Seeded ${createdCount} mock GA4 metrics for property ${propertyId}`);
        return { success: true, createdCount, skippedCount };
    }
    async seedAlerts(tenantId, count = 8) {
        this.logger.log(`Seeding ${count} mock alerts for tenant ${tenantId}`);
        let alertRule = await this.prisma.alertRule.findFirst({
            where: { tenantId, name: 'Mock Alert Rule' },
        });
        if (!alertRule) {
            alertRule = await this.prisma.alertRule.create({
                data: {
                    tenantId,
                    name: 'Mock Alert Rule',
                    alertType: client_1.AlertRuleType.CUSTOM,
                    metric: 'roas',
                    operator: 'lt',
                    threshold: 1.0,
                    severity: client_1.AlertSeverity.WARNING,
                    isActive: true,
                },
            });
        }
        let createdCount = 0;
        const templates = alerts_generator_1.MOCK_ALERT_TEMPLATES.slice(0, count);
        for (const template of templates) {
            const alertData = (0, alerts_generator_1.generateAlertForDB)(tenantId, alertRule.id, template);
            const existing = await this.prisma.alert.findFirst({
                where: {
                    tenantId,
                    message: alertData.message,
                },
            });
            if (!existing) {
                await this.prisma.alert.create({
                    data: {
                        tenant: { connect: { id: tenantId } },
                        rule: { connect: { id: alertRule.id } },
                        type: alertData.alertType,
                        severity: alertData.severity,
                        title: alertData.title,
                        message: alertData.message,
                        metadata: alertData.metadata,
                        status: alertData.status,
                    },
                });
                createdCount++;
            }
        }
        this.logger.log(`Seeded ${createdCount} mock alerts for tenant ${tenantId}`);
        return { success: true, createdCount };
    }
    async seedSyncLogs(tenantId, count = 12) {
        this.logger.log(`Seeding ${count} mock sync logs for tenant ${tenantId}`);
        let createdCount = 0;
        const templates = sync_logs_generator_1.MOCK_SYNC_LOGS.slice(0, count);
        for (const template of templates) {
            const logData = (0, sync_logs_generator_1.generateSyncLogForDB)(tenantId, template);
            await this.prisma.syncLog.create({ data: logData });
            createdCount++;
        }
        this.logger.log(`Seeded ${createdCount} mock sync logs for tenant ${tenantId}`);
        return { success: true, createdCount };
    }
    async seedCampaigns(tenantId, platforms) {
        this.logger.log(`Seeding mock campaigns for tenant ${tenantId}`);
        const platformList = platforms || ['GOOGLE_ADS', 'FACEBOOK', 'TIKTOK', 'LINE_ADS'];
        let createdCount = 0;
        for (const platform of platformList) {
            const campaigns = (0, mock_campaigns_1.getMockCampaignsByPlatform)(platform);
            for (const campaign of campaigns) {
                const existing = await this.prisma.campaign.findFirst({
                    where: {
                        tenantId,
                        externalId: campaign.externalId,
                        platform: campaign.platform,
                    },
                });
                if (!existing) {
                    await this.prisma.campaign.create({
                        data: {
                            tenantId,
                            externalId: campaign.externalId,
                            name: campaign.name,
                            status: campaign.status,
                            budget: campaign.budget,
                            platform: campaign.platform,
                        },
                    });
                    createdCount++;
                }
            }
        }
        this.logger.log(`Seeded ${createdCount} mock campaigns for tenant ${tenantId}`);
        return { success: true, createdCount };
    }
    async seedAll(tenantId, options) {
        const opts = {
            campaigns: true,
            metrics: true,
            alerts: true,
            syncLogs: true,
            metricDays: 30,
            ...options,
        };
        this.logger.log(`Starting full mock data seed for tenant ${tenantId}`);
        const results = {};
        if (opts.campaigns) {
            results.campaigns = await this.seedCampaigns(tenantId);
        }
        if (opts.metrics) {
            const campaigns = await this.prisma.campaign.findMany({
                where: { tenantId },
                select: { id: true },
            });
            let totalMetrics = 0;
            for (const campaign of campaigns) {
                const result = await this.seedCampaignMetrics(campaign.id, opts.metricDays);
                totalMetrics += result.createdCount;
            }
            results.metrics = { success: true, totalCreated: totalMetrics };
        }
        if (opts.alerts) {
            results.alerts = await this.seedAlerts(tenantId);
        }
        if (opts.syncLogs) {
            results.syncLogs = await this.seedSyncLogs(tenantId);
        }
        this.logger.log(`Completed full mock data seed for tenant ${tenantId}`);
        return { success: true, results };
    }
    async clearMockData(tenantId) {
        this.logger.log(`Clearing mock data for tenant ${tenantId}`);
        const metricsDeleted = await this.prisma.metric.deleteMany({
            where: { isMockData: true, campaign: { tenantId } },
        });
        const ga4Deleted = await this.prisma.webAnalyticsDaily.deleteMany({
            where: { tenantId, isMockData: true },
        });
        const alertsDeleted = await this.prisma.alert.deleteMany({
            where: { tenantId, title: { contains: 'Mock' } },
        });
        this.logger.log(`Cleared mock data: ${metricsDeleted.count} metrics, ${ga4Deleted.count} GA4 metrics, ${alertsDeleted.count} alerts`);
        return {
            success: true,
            deleted: {
                metrics: metricsDeleted.count,
                ga4Metrics: ga4Deleted.count,
                alerts: alertsDeleted.count,
            },
        };
    }
    async seedAllCampaignMetrics(tenantId, days = 30) {
        this.logger.log(`Seeding ${days} days of metrics for all campaigns in tenant ${tenantId}`);
        const campaigns = await this.prisma.campaign.findMany({
            where: { tenantId },
            select: { id: true, name: true },
        });
        let totalMetrics = 0;
        for (const campaign of campaigns) {
            const result = await this.seedCampaignMetrics(campaign.id, days);
            totalMetrics += result.createdCount;
        }
        this.logger.log(`Seeded ${totalMetrics} total metrics for ${campaigns.length} campaigns`);
        return { success: true, campaignsCount: campaigns.length, metricsCreated: totalMetrics };
    }
    async clearCampaignsAndMetrics(tenantId) {
        this.logger.log(`Clearing campaigns and metrics for tenant ${tenantId}`);
        const metricsDeleted = await this.prisma.metric.deleteMany({
            where: { isMockData: true, campaign: { tenantId } },
        });
        const campaignsDeleted = await this.prisma.campaign.deleteMany({
            where: {
                tenantId,
                externalId: { startsWith: 'gads-' },
            },
        });
        const fbDeleted = await this.prisma.campaign.deleteMany({
            where: { tenantId, externalId: { startsWith: 'fb-' } },
        });
        const tiktokDeleted = await this.prisma.campaign.deleteMany({
            where: { tenantId, externalId: { startsWith: 'tiktok-' } },
        });
        const lineDeleted = await this.prisma.campaign.deleteMany({
            where: { tenantId, externalId: { startsWith: 'line-' } },
        });
        const totalCampaigns = campaignsDeleted.count + fbDeleted.count + tiktokDeleted.count + lineDeleted.count;
        this.logger.log(`Cleared ${metricsDeleted.count} metrics, ${totalCampaigns} campaigns`);
        return {
            success: true,
            deleted: {
                metrics: metricsDeleted.count,
                campaigns: totalCampaigns,
            },
        };
    }
};
exports.MockDataSeederService = MockDataSeederService;
exports.MockDataSeederService = MockDataSeederService = MockDataSeederService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MockDataSeederService);
//# sourceMappingURL=mock-data-seeder.service.js.map