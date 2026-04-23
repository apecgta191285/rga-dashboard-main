import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationFactory } from '../integrations/common/integration.factory';
import { AdPlatform, Prisma } from '@prisma/client';
import { MarketingPlatformAdapter } from '../integrations/common/marketing-platform.adapter';
import { EncryptionService } from '../../common/services/encryption.service';

function toNumber(value: any, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return Number.isFinite(value) ? value : defaultValue;
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

function toUTCDateOnly(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class UnifiedSyncService {
    private readonly logger = new Logger(UnifiedSyncService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly integrationFactory: IntegrationFactory,
        private readonly encryptionService: EncryptionService,
    ) { }

    private tryDecryptToken(token: string | null | undefined): string | null {
        if (!token) {
            return null;
        }

        if (!token.includes(':')) {
            return token;
        }

        try {
            return this.encryptionService.decrypt(token);
        } catch (error: any) {
            this.logger.warn(`Unable to decrypt token for sync; using raw value: ${error.message}`);
            return token;
        }
    }

    /**
     * Sync all connected accounts across all platforms
     */
    async syncAll() {
        this.logger.log('Starting unified sync for all platforms...');

        const results = {
            [AdPlatform.GOOGLE_ADS]: await this.syncPlatform(AdPlatform.GOOGLE_ADS),
            [AdPlatform.FACEBOOK]: await this.syncPlatform(AdPlatform.FACEBOOK),
            [AdPlatform.GOOGLE_ANALYTICS]: await this.syncPlatform(AdPlatform.GOOGLE_ANALYTICS),
            [AdPlatform.TIKTOK]: await this.syncPlatform(AdPlatform.TIKTOK),
            [AdPlatform.LINE_ADS]: await this.syncPlatform(AdPlatform.LINE_ADS),
        };

        this.logger.log('Unified sync completed', results);
        return results;
    }

    async syncAllForTenant(tenantId: string) {
        this.logger.log(`Starting unified sync for tenant ${tenantId}...`);

        const results = {
            [AdPlatform.GOOGLE_ADS]: await this.syncPlatformForTenant(AdPlatform.GOOGLE_ADS, tenantId),
            [AdPlatform.FACEBOOK]: await this.syncPlatformForTenant(AdPlatform.FACEBOOK, tenantId),
            [AdPlatform.GOOGLE_ANALYTICS]: await this.syncPlatformForTenant(AdPlatform.GOOGLE_ANALYTICS, tenantId),
            [AdPlatform.TIKTOK]: await this.syncPlatformForTenant(AdPlatform.TIKTOK, tenantId),
            [AdPlatform.LINE_ADS]: await this.syncPlatformForTenant(AdPlatform.LINE_ADS, tenantId),
        };

        return results;
    }

    /**
     * Sync all accounts for a specific platform
     */
    async syncPlatform(platform: AdPlatform) {
        this.logger.log(`Syncing all accounts for platform: ${platform}`);
        let accounts: any[] = [];

        // Fetch accounts based on platform
        // TODO: In the future, we should have a unified Account table or a polymorphic relation
        switch (platform) {
            case AdPlatform.GOOGLE_ADS:
                accounts = await this.prisma.googleAdsAccount.findMany({ where: { status: 'ENABLED' } });
                break;
            case AdPlatform.FACEBOOK:
            case 'INSTAGRAM' as any:
                accounts = await this.prisma.facebookAdsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case AdPlatform.GOOGLE_ANALYTICS:
                accounts = await this.prisma.googleAnalyticsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case AdPlatform.TIKTOK:
                accounts = await this.prisma.tikTokAdsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case AdPlatform.LINE_ADS:
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
            } catch (error) {
                this.logger.error(`Failed to sync account ${account.id} (${platform}): ${error.message}`);
                failed++;
            }
        }

        return { success, failed };
    }

    async syncPlatformForTenant(platform: AdPlatform, tenantId: string) {
        this.logger.log(`Syncing accounts for platform ${platform} (tenant ${tenantId})`);
        let accounts: any[] = [];

        switch (platform) {
            case AdPlatform.GOOGLE_ADS:
                accounts = await this.prisma.googleAdsAccount.findMany({ where: { tenantId, status: 'ENABLED' } });
                break;
            case AdPlatform.FACEBOOK:
                accounts = await this.prisma.facebookAdsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case AdPlatform.GOOGLE_ANALYTICS:
                accounts = await this.prisma.googleAnalyticsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case AdPlatform.TIKTOK:
                accounts = await this.prisma.tikTokAdsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case AdPlatform.LINE_ADS:
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
            } catch (error) {
                this.logger.error(`Failed to sync account ${account.id} (${platform}, tenant ${tenantId}): ${error.message}`);
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * Sync a specific account using the Adapter Pattern
     */
    async syncAccount(platform: AdPlatform, accountId: string, tenantId: string, accountData?: any, lookbackDays?: number) {
        this.logger.log(`[SYNC] ========== SYNC START ==========`);
        this.logger.log(`[SYNC] platform=${platform}, accountId=${accountId}, tenantId=${tenantId}`);

        let syncError: Error | null = null;

        try {
            const adapter = this.integrationFactory.getAdapter(platform);
            this.logger.log(`[SYNC] Got adapter for platform=${platform}`);

            // 1. Prepare Credentials
            if (!accountData) {
                this.logger.log(`[SYNC] Fetching account data from database...`);
                accountData = await this.fetchAccountData(platform, accountId);

                if (!accountData) {
                    throw new Error(`Account not found in database: ${accountId}`);
                }

                this.logger.log(`[SYNC] Account data fetched: ${JSON.stringify({
                    id: accountData.id,
                    customerId: accountData.customerId || accountData.propertyId || accountData.accountId,
                    status: accountData.status,
                    hasRefreshToken: !!accountData.refreshToken,
                })}`);
            }

            const credentials = {
                accessToken: this.tryDecryptToken(accountData.accessToken),
                refreshToken: this.tryDecryptToken(accountData.refreshToken),
                accountId: (() => {
                    switch (platform) {
                        case AdPlatform.GOOGLE_ANALYTICS:
                            return accountData.propertyId;
                        case AdPlatform.GOOGLE_ADS:
                            return accountData.customerId;
                        case AdPlatform.FACEBOOK:
                            return accountData.accountId;
                        case AdPlatform.TIKTOK:
                            return accountData.advertiserId;
                        case AdPlatform.LINE_ADS:
                            return accountData.channelId;
                        default:
                            return accountData.accountId;
                    }
                })(),
            };

            this.logger.log(`[SYNC] Credentials prepared: accountId=${credentials.accountId}`);

            // 2. Fetch Campaigns (if applicable)
            this.logger.log(`[SYNC] Calling adapter.fetchCampaigns()...`);
            const campaigns = await adapter.fetchCampaigns(credentials);
            this.logger.log(`[SYNC] ✅ Fetched ${campaigns.length} campaigns`);

            // 3. Save Campaigns to DB
            this.logger.log(`[SYNC] Saving campaigns to database...`);
            for (const campaign of campaigns) {
                await this.saveCampaign(tenantId, platform, accountId, campaign);
            }
            this.logger.log(`[SYNC] ✅ Saved ${campaigns.length} campaigns`);

            // 4. Fetch & Save Metrics
            if (platform === AdPlatform.GOOGLE_ANALYTICS) {
                // GA4 Logic: Fetch Account Level Metrics
                const days = lookbackDays || 90;
                const dateRange = {
                    startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                    endDate: new Date(),
                };

                const metrics = await adapter.fetchMetrics(credentials, credentials.accountId, dateRange);
                await this.saveWebAnalytics(tenantId, credentials.accountId, metrics);

            } else {
                // Ads Logic: Fetch Campaign Level Metrics
                const campaignPlatforms = platform === ('INSTAGRAM' as any as AdPlatform) ? [AdPlatform.FACEBOOK] : [platform];
                const accountFilterField =
                    platform === AdPlatform.GOOGLE_ADS
                        ? 'googleAdsAccountId'
                        : platform === AdPlatform.FACEBOOK || platform === ('INSTAGRAM' as any as AdPlatform)
                            ? 'facebookAdsAccountId'
                            : platform === AdPlatform.TIKTOK
                                ? 'tiktokAdsAccountId'
                                : 'lineAdsAccountId';

                const dbCampaigns = await this.prisma.campaign.findMany({
                    where: {
                        tenantId,
                        platform: { in: campaignPlatforms },
                        [accountFilterField]: accountId,
                    }
                });

                this.logger.log(`[SYNC] Fetching metrics for ${dbCampaigns.length} campaigns...`);
                for (const campaign of dbCampaigns) {
                    if (!campaign.externalId) continue;

                    const days = lookbackDays || 365;
                    const dateRange = {
                        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                        endDate: new Date(),
                    };

                    const metrics = await adapter.fetchMetrics(credentials, campaign.externalId, dateRange);
                    await this.saveCampaignMetrics(tenantId, platform, campaign.id, metrics);
                }
                this.logger.log(`[SYNC] ✅ Metrics fetched and saved`);
            }

        } catch (err: any) {
            syncError = err;
            this.logger.error(`[SYNC] ❌ Error during sync: ${err.message}`);
            this.logger.error(`[SYNC] Stack: ${err.stack}`);
        }

        // IMPORTANT: Always update lastSyncAt, even if there was an error
        // This way the user knows when the last sync attempt was made
        this.logger.log(`[SYNC] Updating lastSyncAt for account...`);
        await this.updateLastSync(platform, accountId);
        this.logger.log(`[SYNC] ========== SYNC COMPLETE ==========`);

        // Re-throw error after updating lastSyncAt
        if (syncError) {
            throw syncError;
        }
    }

    private async fetchAccountData(platform: AdPlatform, accountId: string) {
        switch (platform) {
            case AdPlatform.GOOGLE_ADS:
                return this.prisma.googleAdsAccount.findUnique({ where: { id: accountId } });
            case AdPlatform.FACEBOOK:
            case 'INSTAGRAM' as any:
                return this.prisma.facebookAdsAccount.findUnique({ where: { id: accountId } });
            case AdPlatform.GOOGLE_ANALYTICS:
                return this.prisma.googleAnalyticsAccount.findUnique({ where: { id: accountId } });
            case AdPlatform.TIKTOK:
                return this.prisma.tikTokAdsAccount.findUnique({ where: { id: accountId } });
            case AdPlatform.LINE_ADS:
                return this.prisma.lineAdsAccount.findUnique({ where: { id: accountId } });
            default:
                throw new Error(`Unknown platform ${platform}`);
        }
    }

    private async saveCampaign(tenantId: string, platform: AdPlatform, accountId: string, data: any) {
        // Common logic to upsert campaign
        const fkField =
            platform === AdPlatform.GOOGLE_ADS
                ? 'googleAdsAccountId'
                : platform === AdPlatform.FACEBOOK
                    ? 'facebookAdsAccountId'
                    : platform === AdPlatform.TIKTOK
                        ? 'tiktokAdsAccountId'
                        : 'lineAdsAccountId';

        // Check existence
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
            const campaign = await this.prisma.campaign.update({
                where: { id: existing.id },
                data: campaignData
            });

            // 4. Save Lifetime Metrics (Direct from Platform API)
            if (data.metrics) {
                await this.saveLifetimeMetrics(tenantId, platform, campaign.id, data.metrics);
            }
            return campaign;
        } else {
            const campaign = await this.prisma.campaign.create({
                data: {
                    ...campaignData,
                    tenantId,
                    externalId: data.externalId,
                    platform,
                }
            });

            // 4. Save Lifetime Metrics (Direct from Platform API)
            if (data.metrics) {
                await this.saveLifetimeMetrics(tenantId, platform, campaign.id, data.metrics);
            }
            return campaign;
        }
    }

    /**
     * Keep a special 'lifetime_summary' row in Metric table
     * to preserve absolute totals from platforms (even for old campaigns)
     */
    private async saveLifetimeMetrics(tenantId: string, platform: AdPlatform, campaignId: string, metrics: any) {
        const date = new Date('1970-01-01'); // Token date for lifetime entry
        const source = 'lifetime_summary';

        await this.prisma.metric.upsert({
            where: {
                metrics_unique_key: {
                    tenantId,
                    campaignId,
                    date,
                    hour: 0,
                    platform,
                    source,
                },
            },
            create: {
                tenantId,
                campaignId,
                platform,
                date,
                hour: 0,
                source,
                impressions: Math.trunc(metrics.impressions || 0),
                clicks: Math.trunc(metrics.clicks || 0),
                spend: metrics.cost || metrics.spend || 0,
                revenue: metrics.revenue || metrics.conversionsValue || 0,
                conversions: Math.trunc(metrics.conversions || 0),
            },
            update: {
                impressions: Math.trunc(metrics.impressions || 0),
                clicks: Math.trunc(metrics.clicks || 0),
                spend: metrics.cost || metrics.spend || 0,
                revenue: metrics.revenue || metrics.conversionsValue || 0,
                conversions: Math.trunc(metrics.conversions || 0),
            },
        });
    }

    /**
     * Save campaign metrics to DB
     * Note: Schema V2 does not have cpc, ctr, cpm columns in Metric model
     * These are calculated fields in the service layer
     */
    private async saveCampaignMetrics(tenantId: string, platform: AdPlatform, campaignId: string, metrics: any[]) {
        for (const m of metrics) {
            const date = toUTCDateOnly(new Date(m.date));

            const hour = 0;
            const source = 'sync';

            const spendNum = toNumber(m.spend ?? m.cost);
            const revenueNum = toNumber(m.revenue ?? m.conversionValue);
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

    /**
     * Save web analytics data to DB
     */
    private async saveWebAnalytics(tenantId: string, propertyId: string, metrics: any[]) {
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

    private async updateLastSync(platform: AdPlatform, accountId: string) {
        const now = new Date();
        this.logger.log(`[SYNC] updateLastSync: platform=${platform}, accountId=${accountId}, time=${now.toISOString()}`);

        try {
            switch (platform) {
                case AdPlatform.GOOGLE_ADS:
                    await this.prisma.googleAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                    this.logger.log(`[SYNC] ✅ Updated googleAdsAccount.lastSyncAt`);
                    break;
                case AdPlatform.FACEBOOK:
                case 'INSTAGRAM' as any:
                    await this.prisma.facebookAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                    this.logger.log(`[SYNC] ✅ Updated facebookAdsAccount.lastSyncAt`);
                    break;
                case AdPlatform.GOOGLE_ANALYTICS:
                    await this.prisma.googleAnalyticsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                    this.logger.log(`[SYNC] ✅ Updated googleAnalyticsAccount.lastSyncAt`);
                    break;
                case AdPlatform.TIKTOK:
                    await this.prisma.tikTokAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                    this.logger.log(`[SYNC] ✅ Updated tikTokAdsAccount.lastSyncAt`);
                    break;
                case AdPlatform.LINE_ADS:
                    await this.prisma.lineAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                    this.logger.log(`[SYNC] ✅ Updated lineAdsAccount.lastSyncAt`);
                    break;
            }
        } catch (err) {
            this.logger.error(`[SYNC] ❌ updateLastSync failed: ${err.message}`);
            throw err;
        }
    }
}
