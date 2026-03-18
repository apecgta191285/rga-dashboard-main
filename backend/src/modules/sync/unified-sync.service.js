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
var UnifiedSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const integration_factory_1 = require("../integrations/common/integration.factory");
const client_1 = require("@prisma/client");
function toNumber(value, defaultValue = 0) {
    if (value === null || value === undefined)
        return defaultValue;
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : defaultValue;
    if (typeof value === 'string') {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
    }
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
}
function toUTCDateOnly(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
let UnifiedSyncService = UnifiedSyncService_1 = class UnifiedSyncService {
    constructor(prisma, integrationFactory) {
        this.prisma = prisma;
        this.integrationFactory = integrationFactory;
        this.logger = new common_1.Logger(UnifiedSyncService_1.name);
    }
    async syncAll() {
        this.logger.log('Starting unified sync for all platforms...');
        const results = {
            [client_1.AdPlatform.GOOGLE_ADS]: await this.syncPlatform(client_1.AdPlatform.GOOGLE_ADS),
            [client_1.AdPlatform.FACEBOOK]: await this.syncPlatform(client_1.AdPlatform.FACEBOOK),
            [client_1.AdPlatform.GOOGLE_ANALYTICS]: await this.syncPlatform(client_1.AdPlatform.GOOGLE_ANALYTICS),
            [client_1.AdPlatform.TIKTOK]: await this.syncPlatform(client_1.AdPlatform.TIKTOK),
            [client_1.AdPlatform.LINE_ADS]: await this.syncPlatform(client_1.AdPlatform.LINE_ADS),
        };
        this.logger.log('Unified sync completed', results);
        return results;
    }
    async syncAllForTenant(tenantId) {
        this.logger.log(`Starting unified sync for tenant ${tenantId}...`);
        const results = {
            [client_1.AdPlatform.GOOGLE_ADS]: await this.syncPlatformForTenant(client_1.AdPlatform.GOOGLE_ADS, tenantId),
            [client_1.AdPlatform.FACEBOOK]: await this.syncPlatformForTenant(client_1.AdPlatform.FACEBOOK, tenantId),
            [client_1.AdPlatform.GOOGLE_ANALYTICS]: await this.syncPlatformForTenant(client_1.AdPlatform.GOOGLE_ANALYTICS, tenantId),
            [client_1.AdPlatform.TIKTOK]: await this.syncPlatformForTenant(client_1.AdPlatform.TIKTOK, tenantId),
            [client_1.AdPlatform.LINE_ADS]: await this.syncPlatformForTenant(client_1.AdPlatform.LINE_ADS, tenantId),
        };
        return results;
    }
    async syncPlatform(platform) {
        this.logger.log(`Syncing all accounts for platform: ${platform}`);
        let accounts = [];
        switch (platform) {
            case client_1.AdPlatform.GOOGLE_ADS:
                accounts = await this.prisma.googleAdsAccount.findMany({ where: { status: 'ENABLED' } });
                break;
            case client_1.AdPlatform.FACEBOOK:
            case 'INSTAGRAM':
                accounts = await this.prisma.facebookAdsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case client_1.AdPlatform.GOOGLE_ANALYTICS:
                accounts = await this.prisma.googleAnalyticsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case client_1.AdPlatform.TIKTOK:
                accounts = await this.prisma.tikTokAdsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case client_1.AdPlatform.LINE_ADS:
                accounts = await this.prisma.lineAdsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            default:
                this.logger.warn(`Platform ${platform} not supported for batch sync`);
                return { success: 0, failed: 0 };
        }
        let success = 0;
        let failed = 0;
        for (const account of accounts) {
            try {
                await this.syncAccount(platform, account.id, account.tenantId, account);
                success++;
            }
            catch (error) {
                this.logger.error(`Failed to sync account ${account.id} (${platform}): ${error.message}`);
                failed++;
            }
        }
        return { success, failed };
    }
    async syncPlatformForTenant(platform, tenantId) {
        this.logger.log(`Syncing accounts for platform ${platform} (tenant ${tenantId})`);
        let accounts = [];
        switch (platform) {
            case client_1.AdPlatform.GOOGLE_ADS:
                accounts = await this.prisma.googleAdsAccount.findMany({ where: { tenantId, status: 'ENABLED' } });
                break;
            case client_1.AdPlatform.FACEBOOK:
                accounts = await this.prisma.facebookAdsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case client_1.AdPlatform.GOOGLE_ANALYTICS:
                accounts = await this.prisma.googleAnalyticsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case client_1.AdPlatform.TIKTOK:
                accounts = await this.prisma.tikTokAdsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case client_1.AdPlatform.LINE_ADS:
                accounts = await this.prisma.lineAdsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            default:
                this.logger.warn(`Platform ${platform} not supported for tenant sync`);
                return { success: 0, failed: 0 };
        }
        let success = 0;
        let failed = 0;
        for (const account of accounts) {
            try {
                await this.syncAccount(platform, account.id, tenantId, account);
                success++;
            }
            catch (error) {
                this.logger.error(`Failed to sync account ${account.id} (${platform}, tenant ${tenantId}): ${error.message}`);
                failed++;
            }
        }
        return { success, failed };
    }
    async syncAccount(platform, accountId, tenantId, accountData) {
        const adapter = this.integrationFactory.getAdapter(platform);
        if (!accountData) {
            accountData = await this.fetchAccountData(platform, accountId);
        }
        const credentials = {
            accessToken: accountData.accessToken,
            refreshToken: accountData.refreshToken,
            accountId: (() => {
                switch (platform) {
                    case client_1.AdPlatform.GOOGLE_ANALYTICS:
                        return accountData.propertyId;
                    case client_1.AdPlatform.GOOGLE_ADS:
                        return accountData.customerId;
                    case client_1.AdPlatform.FACEBOOK:
                        return accountData.accountId;
                    case client_1.AdPlatform.TIKTOK:
                        return accountData.advertiserId;
                    case client_1.AdPlatform.LINE_ADS:
                        return accountData.channelId;
                    default:
                        return accountData.accountId;
                }
            })(),
        };
        const campaigns = await adapter.fetchCampaigns(credentials);
        for (const campaign of campaigns) {
            await this.saveCampaign(tenantId, platform, accountId, campaign);
        }
        if (platform === client_1.AdPlatform.GOOGLE_ANALYTICS) {
            const dateRange = {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
            };
            const metrics = await adapter.fetchMetrics(credentials, credentials.accountId, dateRange);
            await this.saveWebAnalytics(tenantId, credentials.accountId, metrics);
        }
        else {
            const campaignPlatforms = platform === 'INSTAGRAM' ? [client_1.AdPlatform.FACEBOOK] : [platform];
            const dbCampaigns = await this.prisma.campaign.findMany({
                where: {
                    tenantId,
                    platform: { in: campaignPlatforms },
                    OR: [
                        { googleAdsAccountId: accountId },
                        { facebookAdsAccountId: accountId }
                    ]
                }
            });
            for (const campaign of dbCampaigns) {
                if (!campaign.externalId)
                    continue;
                const dateRange = {
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    endDate: new Date(),
                };
                const metrics = await adapter.fetchMetrics(credentials, campaign.externalId, dateRange);
                await this.saveCampaignMetrics(tenantId, platform, campaign.id, metrics);
            }
        }
        await this.updateLastSync(platform, accountId);
    }
    async fetchAccountData(platform, accountId) {
        switch (platform) {
            case client_1.AdPlatform.GOOGLE_ADS:
                return this.prisma.googleAdsAccount.findUnique({ where: { id: accountId } });
            case client_1.AdPlatform.FACEBOOK:
            case 'INSTAGRAM':
                return this.prisma.facebookAdsAccount.findUnique({ where: { id: accountId } });
            case client_1.AdPlatform.GOOGLE_ANALYTICS:
                return this.prisma.googleAnalyticsAccount.findUnique({ where: { id: accountId } });
            case client_1.AdPlatform.TIKTOK:
                return this.prisma.tikTokAdsAccount.findUnique({ where: { id: accountId } });
            case client_1.AdPlatform.LINE_ADS:
                return this.prisma.lineAdsAccount.findUnique({ where: { id: accountId } });
            default:
                throw new Error(`Unknown platform ${platform}`);
        }
    }
    async saveCampaign(tenantId, platform, accountId, data) {
        const fkField = platform === client_1.AdPlatform.GOOGLE_ADS
            ? 'googleAdsAccountId'
            : platform === client_1.AdPlatform.FACEBOOK
                ? 'facebookAdsAccountId'
                : platform === client_1.AdPlatform.TIKTOK
                    ? 'tiktokAdsAccountId'
                    : 'lineAdsAccountId';
        const existing = await this.prisma.campaign.findFirst({
            where: {
                tenantId,
                externalId: data.externalId,
                platform,
            }
        });
        const campaignData = {
            name: data.name,
            status: data.status,
            budget: data.budget,
            startDate: data.startDate,
            endDate: data.endDate,
            [fkField]: accountId,
        };
        if (existing) {
            return this.prisma.campaign.update({
                where: { id: existing.id },
                data: campaignData
            });
        }
        else {
            return this.prisma.campaign.create({
                data: {
                    ...campaignData,
                    tenantId,
                    externalId: data.externalId,
                    platform,
                }
            });
        }
    }
    async saveCampaignMetrics(tenantId, platform, campaignId, metrics) {
        for (const m of metrics) {
            const date = toUTCDateOnly(new Date(m.date));
            const hour = 0;
            const source = 'sync';
            const spendNum = toNumber(m.spend);
            const revenueNum = toNumber(m.revenue);
            const roasNum = spendNum > 0 ? revenueNum / spendNum : 0;
            const impressions = m.impressions ?? 0;
            const clicks = m.clicks ?? 0;
            const conversions = m.conversions ?? 0;
            await this.prisma.metric.upsert({
                where: {
                    metrics_unique_key: {
                        tenantId,
                        campaignId,
                        date,
                        hour,
                        platform,
                        source,
                    },
                },
                create: {
                    tenantId,
                    campaignId,
                    platform,
                    date,
                    hour,
                    source,
                    impressions,
                    clicks,
                    spend: spendNum,
                    conversions,
                    revenue: revenueNum,
                    roas: roasNum,
                },
                update: {
                    impressions,
                    clicks,
                    spend: spendNum,
                    conversions,
                    revenue: revenueNum,
                    roas: roasNum,
                },
            });
        }
    }
    async saveWebAnalytics(tenantId, propertyId, metrics) {
        for (const m of metrics) {
            const date = toUTCDateOnly(new Date(m.date));
            await this.prisma.webAnalyticsDaily.upsert({
                where: {
                    web_analytics_daily_unique: {
                        tenantId,
                        propertyId,
                        date,
                    },
                },
                create: {
                    tenantId,
                    propertyId,
                    date,
                    activeUsers: m.impressions ?? 0,
                    sessions: m.clicks ?? 0,
                    newUsers: 0,
                    screenPageViews: 0,
                    engagementRate: 0,
                    bounceRate: 0,
                    avgSessionDuration: 0,
                },
                update: {
                    activeUsers: m.impressions ?? 0,
                    sessions: m.clicks ?? 0,
                },
            });
        }
    }
    async updateLastSync(platform, accountId) {
        const now = new Date();
        switch (platform) {
            case client_1.AdPlatform.GOOGLE_ADS:
                await this.prisma.googleAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
            case client_1.AdPlatform.FACEBOOK:
            case 'INSTAGRAM':
                await this.prisma.facebookAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
            case client_1.AdPlatform.GOOGLE_ANALYTICS:
                await this.prisma.googleAnalyticsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
            case client_1.AdPlatform.TIKTOK:
                await this.prisma.tikTokAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
            case client_1.AdPlatform.LINE_ADS:
                await this.prisma.lineAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
        }
    }
};
exports.UnifiedSyncService = UnifiedSyncService;
exports.UnifiedSyncService = UnifiedSyncService = UnifiedSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        integration_factory_1.IntegrationFactory])
], UnifiedSyncService);
//# sourceMappingURL=unified-sync.service.js.map