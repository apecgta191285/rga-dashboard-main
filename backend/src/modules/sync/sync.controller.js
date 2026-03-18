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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const unified_sync_service_1 = require("./unified-sync.service");
let SyncController = class SyncController {
    constructor(unifiedSyncService, prisma) {
        this.unifiedSyncService = unifiedSyncService;
        this.prisma = prisma;
    }
    async syncAll(tenantId) {
        return this.unifiedSyncService.syncAllForTenant(tenantId);
    }
    async syncPlatform(tenantId, platform) {
        const normalized = platform.toUpperCase();
        if (!(normalized in client_1.AdPlatform)) {
            throw new common_1.BadRequestException(`Invalid platform: ${platform}`);
        }
        return this.unifiedSyncService.syncPlatformForTenant(normalized, tenantId);
    }
    async syncAccount(tenantId, platform, accountId) {
        const normalized = platform.toUpperCase();
        if (!(normalized in client_1.AdPlatform)) {
            throw new common_1.BadRequestException(`Invalid platform: ${platform}`);
        }
        await this.assertAccountOwnership(normalized, accountId, tenantId);
        await this.unifiedSyncService.syncAccount(normalized, accountId, tenantId);
        return { success: true, message: 'Sync started' };
    }
    async assertAccountOwnership(platform, accountId, tenantId) {
        switch (platform) {
            case client_1.AdPlatform.GOOGLE_ADS: {
                const account = await this.prisma.googleAdsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account)
                    throw new common_1.BadRequestException('Account not found for this tenant');
                return;
            }
            case client_1.AdPlatform.FACEBOOK: {
                const account = await this.prisma.facebookAdsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account)
                    throw new common_1.BadRequestException('Account not found for this tenant');
                return;
            }
            case client_1.AdPlatform.GOOGLE_ANALYTICS: {
                const account = await this.prisma.googleAnalyticsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account)
                    throw new common_1.BadRequestException('Account not found for this tenant');
                return;
            }
            case client_1.AdPlatform.TIKTOK: {
                const account = await this.prisma.tikTokAdsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account)
                    throw new common_1.BadRequestException('Account not found for this tenant');
                return;
            }
            case client_1.AdPlatform.LINE_ADS: {
                const account = await this.prisma.lineAdsAccount.findFirst({ where: { id: accountId, tenantId } });
                if (!account)
                    throw new common_1.BadRequestException('Account not found for this tenant');
                return;
            }
            default:
                throw new common_1.BadRequestException(`Platform not supported: ${platform}`);
        }
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual sync for all platforms (tenant-scoped)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "syncAll", null);
__decorate([
    (0, common_1.Post)('platform/:platform'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual sync for a platform (tenant-scoped)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "syncPlatform", null);
__decorate([
    (0, common_1.Post)(':platform/accounts/:accountId'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual sync for a specific account (tenant-scoped)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('platform')),
    __param(2, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "syncAccount", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('Sync'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [unified_sync_service_1.UnifiedSyncService,
        prisma_service_1.PrismaService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map