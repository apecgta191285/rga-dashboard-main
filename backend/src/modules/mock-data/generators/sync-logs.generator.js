"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_SYNC_LOGS = void 0;
exports.generateSyncLogForDB = generateSyncLogForDB;
exports.generateMockSyncLogs = generateMockSyncLogs;
const client_1 = require("@prisma/client");
exports.MOCK_SYNC_LOGS = [
    {
        platform: client_1.AdPlatform.GOOGLE_ADS,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 156,
        daysAgo: 0,
    },
    {
        platform: client_1.AdPlatform.FACEBOOK,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 89,
        daysAgo: 0,
    },
    {
        platform: client_1.AdPlatform.GOOGLE_ANALYTICS,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 30,
        daysAgo: 0,
    },
    {
        platform: client_1.AdPlatform.GOOGLE_ADS,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 142,
        daysAgo: 1,
    },
    {
        platform: client_1.AdPlatform.TIKTOK,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.MANUAL,
        recordsCount: 45,
        daysAgo: 1,
    },
    {
        platform: client_1.AdPlatform.LINE_ADS,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.INITIAL,
        recordsCount: 28,
        daysAgo: 1,
    },
    {
        platform: client_1.AdPlatform.GOOGLE_ADS,
        status: client_1.SyncStatus.FAILED,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 0,
        errorMessage: 'API rate limit exceeded. Retry in 60 seconds.',
        daysAgo: 2,
    },
    {
        platform: client_1.AdPlatform.GOOGLE_ADS,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 138,
        daysAgo: 2,
    },
    {
        platform: client_1.AdPlatform.FACEBOOK,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 76,
        daysAgo: 2,
    },
    {
        platform: client_1.AdPlatform.GOOGLE_ANALYTICS,
        status: client_1.SyncStatus.FAILED,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 0,
        errorMessage: 'Invalid credentials. Please reconnect your account.',
        daysAgo: 3,
    },
    {
        platform: client_1.AdPlatform.GOOGLE_ADS,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.SCHEDULED,
        recordsCount: 145,
        daysAgo: 3,
    },
    {
        platform: client_1.AdPlatform.FACEBOOK,
        status: client_1.SyncStatus.SUCCESS,
        syncType: client_1.SyncType.INITIAL,
        recordsCount: 234,
        daysAgo: 5,
    },
    {
        platform: client_1.AdPlatform.GOOGLE_ADS,
        status: client_1.SyncStatus.COMPLETED,
        syncType: client_1.SyncType.INITIAL,
        recordsCount: 567,
        daysAgo: 5,
    },
];
function generateSyncLogForDB(tenantId, template) {
    const now = new Date();
    const startedAt = new Date(now);
    startedAt.setDate(startedAt.getDate() - template.daysAgo);
    startedAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    const completedAt = template.status === client_1.SyncStatus.SUCCESS || template.status === client_1.SyncStatus.COMPLETED || template.status === client_1.SyncStatus.FAILED
        ? new Date(startedAt.getTime() + Math.random() * 60000 * 5)
        : null;
    return {
        tenantId,
        platform: template.platform,
        accountId: `mock-${template.platform.toLowerCase()}-001`,
        syncType: template.syncType,
        status: template.status,
        startedAt,
        completedAt,
        errorMessage: template.errorMessage || null,
        recordsCount: template.recordsCount,
        recordsSync: template.recordsCount,
    };
}
function generateMockSyncLogs(count = 12) {
    return exports.MOCK_SYNC_LOGS.slice(0, count);
}
//# sourceMappingURL=sync-logs.generator.js.map