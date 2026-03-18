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
var SyncSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const unified_sync_service_1 = require("./unified-sync.service");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let SyncSchedulerService = SyncSchedulerService_1 = class SyncSchedulerService {
    constructor(unifiedSyncService, prisma) {
        this.unifiedSyncService = unifiedSyncService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(SyncSchedulerService_1.name);
    }
    async scheduledGoogleAdsSync() {
        this.logger.log('Starting scheduled Google Ads sync (Unified Engine)...');
        await this.unifiedSyncService.syncPlatform(client_1.AdPlatform.GOOGLE_ADS);
        this.logger.log('Scheduled Google Ads sync completed');
    }
    async scheduledGA4Sync() {
        this.logger.log('Starting scheduled GA4 sync (Unified Engine)...');
        await this.unifiedSyncService.syncPlatform(client_1.AdPlatform.GOOGLE_ANALYTICS);
        this.logger.log('Scheduled GA4 sync completed');
    }
    async scheduledFacebookAdsSync() {
        this.logger.log('Starting scheduled Facebook Ads sync (Unified Engine)...');
        await this.unifiedSyncService.syncPlatform(client_1.AdPlatform.FACEBOOK);
        this.logger.log('Scheduled Facebook Ads sync completed');
    }
    async scheduledTikTokAdsSync() {
        this.logger.log('Starting scheduled TikTok Ads sync (Unified Engine)...');
        await this.unifiedSyncService.syncPlatform(client_1.AdPlatform.TIKTOK);
        this.logger.log('Scheduled TikTok Ads sync completed');
    }
    async scheduledLineAdsSync() {
        this.logger.log('Starting scheduled LINE Ads sync (Unified Engine)...');
        await this.unifiedSyncService.syncPlatform(client_1.AdPlatform.LINE_ADS);
        this.logger.log('Scheduled LINE Ads sync completed');
    }
    async getSyncStatus(tenantId) {
        const latestLogs = await this.prisma.syncLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        const googleAdsLog = latestLogs.find(log => log.platform === client_1.AdPlatform.GOOGLE_ADS);
        const ga4Log = latestLogs.find(log => log.platform === client_1.AdPlatform.GOOGLE_ANALYTICS);
        const facebookLog = latestLogs.find(log => log.platform === client_1.AdPlatform.FACEBOOK);
        const tiktokLog = latestLogs.find(log => log.platform === client_1.AdPlatform.TIKTOK);
        const lineLog = latestLogs.find(log => log.platform === client_1.AdPlatform.LINE_ADS);
        const formatStatus = (log) => log ? {
            lastSyncAt: log.completedAt,
            status: log.status,
            errorMessage: log.errorMessage,
        } : null;
        return {
            googleAds: formatStatus(googleAdsLog),
            ga4: formatStatus(ga4Log),
            facebook: formatStatus(facebookLog),
            tiktok: formatStatus(tiktokLog),
            line: formatStatus(lineLog),
            recentLogs: latestLogs,
        };
    }
};
exports.SyncSchedulerService = SyncSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncSchedulerService.prototype, "scheduledGoogleAdsSync", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncSchedulerService.prototype, "scheduledGA4Sync", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncSchedulerService.prototype, "scheduledFacebookAdsSync", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncSchedulerService.prototype, "scheduledTikTokAdsSync", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncSchedulerService.prototype, "scheduledLineAdsSync", null);
exports.SyncSchedulerService = SyncSchedulerService = SyncSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [unified_sync_service_1.UnifiedSyncService,
        prisma_service_1.PrismaService])
], SyncSchedulerService);
//# sourceMappingURL=sync-scheduler.service.js.map