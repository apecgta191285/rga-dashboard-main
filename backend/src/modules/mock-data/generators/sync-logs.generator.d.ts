import { SyncStatus, SyncType, AdPlatform } from '@prisma/client';
interface MockSyncLog {
    platform: AdPlatform;
    status: SyncStatus;
    syncType: SyncType;
    recordsCount: number;
    errorMessage?: string;
    daysAgo: number;
}
export declare const MOCK_SYNC_LOGS: MockSyncLog[];
export declare function generateSyncLogForDB(tenantId: string, template: MockSyncLog): {
    tenantId: string;
    platform: import(".prisma/client").$Enums.AdPlatform;
    accountId: string;
    syncType: import(".prisma/client").$Enums.SyncType;
    status: import(".prisma/client").$Enums.SyncStatus;
    startedAt: Date;
    completedAt: Date;
    errorMessage: string;
    recordsCount: number;
    recordsSync: number;
};
export declare function generateMockSyncLogs(count?: number): MockSyncLog[];
export {};
