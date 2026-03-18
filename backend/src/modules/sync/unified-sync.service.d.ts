import { PrismaService } from '../prisma/prisma.service';
import { IntegrationFactory } from '../integrations/common/integration.factory';
import { AdPlatform } from '@prisma/client';
export declare class UnifiedSyncService {
    private readonly prisma;
    private readonly integrationFactory;
    private readonly logger;
    constructor(prisma: PrismaService, integrationFactory: IntegrationFactory);
    syncAll(): Promise<{
        GOOGLE_ADS: {
            success: number;
            failed: number;
        };
        FACEBOOK: {
            success: number;
            failed: number;
        };
        GOOGLE_ANALYTICS: {
            success: number;
            failed: number;
        };
        TIKTOK: {
            success: number;
            failed: number;
        };
        LINE_ADS: {
            success: number;
            failed: number;
        };
    }>;
    syncAllForTenant(tenantId: string): Promise<{
        GOOGLE_ADS: {
            success: number;
            failed: number;
        };
        FACEBOOK: {
            success: number;
            failed: number;
        };
        GOOGLE_ANALYTICS: {
            success: number;
            failed: number;
        };
        TIKTOK: {
            success: number;
            failed: number;
        };
        LINE_ADS: {
            success: number;
            failed: number;
        };
    }>;
    syncPlatform(platform: AdPlatform): Promise<{
        success: number;
        failed: number;
    }>;
    syncPlatformForTenant(platform: AdPlatform, tenantId: string): Promise<{
        success: number;
        failed: number;
    }>;
    syncAccount(platform: AdPlatform, accountId: string, tenantId: string, accountData?: any): Promise<void>;
    private fetchAccountData;
    private saveCampaign;
    private saveCampaignMetrics;
    private saveWebAnalytics;
    private updateLastSync;
}
