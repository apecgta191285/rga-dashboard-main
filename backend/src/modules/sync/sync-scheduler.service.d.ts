import { UnifiedSyncService } from './unified-sync.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class SyncSchedulerService {
    private readonly unifiedSyncService;
    private readonly prisma;
    private readonly logger;
    constructor(unifiedSyncService: UnifiedSyncService, prisma: PrismaService);
    scheduledGoogleAdsSync(): Promise<void>;
    scheduledGA4Sync(): Promise<void>;
    scheduledFacebookAdsSync(): Promise<void>;
    scheduledTikTokAdsSync(): Promise<void>;
    scheduledLineAdsSync(): Promise<void>;
    getSyncStatus(tenantId: string): Promise<{
        googleAds: {
            lastSyncAt: any;
            status: any;
            errorMessage: any;
        };
        ga4: {
            lastSyncAt: any;
            status: any;
            errorMessage: any;
        };
        facebook: {
            lastSyncAt: any;
            status: any;
            errorMessage: any;
        };
        tiktok: {
            lastSyncAt: any;
            status: any;
            errorMessage: any;
        };
        line: {
            lastSyncAt: any;
            status: any;
            errorMessage: any;
        };
        recentLogs: {
            id: string;
            tenantId: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/client").JsonValue | null;
            platform: import(".prisma/client").$Enums.AdPlatform;
            status: import(".prisma/client").$Enums.SyncStatus;
            integrationId: string | null;
            accountId: string | null;
            syncType: import(".prisma/client").$Enums.SyncType | null;
            startedAt: Date;
            completedAt: Date | null;
            errorMessage: string | null;
            recordsCount: number | null;
            recordsSync: number;
        }[];
    }>;
}
