import { PrismaService } from '../prisma/prisma.service';
import { UnifiedSyncService } from './unified-sync.service';
export declare class SyncController {
    private readonly unifiedSyncService;
    private readonly prisma;
    constructor(unifiedSyncService: UnifiedSyncService, prisma: PrismaService);
    syncAll(tenantId: string): Promise<{
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
    syncPlatform(tenantId: string, platform: string): Promise<{
        success: number;
        failed: number;
    }>;
    syncAccount(tenantId: string, platform: string, accountId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private assertAccountOwnership;
}
