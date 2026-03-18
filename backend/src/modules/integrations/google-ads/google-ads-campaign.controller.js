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
exports.GoogleAdsCampaignController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const google_ads_campaign_service_1 = require("./google-ads-campaign.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const unified_sync_service_1 = require("../../sync/unified-sync.service");
const client_1 = require("@prisma/client");
let GoogleAdsCampaignController = class GoogleAdsCampaignController {
    constructor(campaignService, prisma, unifiedSyncService) {
        this.campaignService = campaignService;
        this.prisma = prisma;
        this.unifiedSyncService = unifiedSyncService;
    }
    async validateAccountOwnership(accountId, tenantId) {
        const account = await this.prisma.googleAdsAccount.findFirst({
            where: {
                id: accountId,
                tenantId: tenantId,
            },
        });
        if (!account) {
            throw new common_1.ForbiddenException('You do not have access to this Google Ads account');
        }
    }
    async fetchCampaigns(accountId, req) {
        await this.validateAccountOwnership(accountId, req.user.tenantId);
        return this.campaignService.fetchCampaigns(accountId);
    }
    async syncCampaigns(accountId, req) {
        await this.validateAccountOwnership(accountId, req.user.tenantId);
        await this.unifiedSyncService.syncAccount(client_1.AdPlatform.GOOGLE_ADS, accountId, req.user.tenantId);
        return { success: true, message: 'Sync started' };
    }
    async syncCampaignMetrics(accountId, campaignId, days, req) {
        await this.validateAccountOwnership(accountId, req.user.tenantId);
        await this.unifiedSyncService.syncAccount(client_1.AdPlatform.GOOGLE_ADS, accountId, req.user.tenantId);
        return { success: true, message: 'Sync started (Account Level)' };
    }
    async syncAllCampaignMetrics(accountId, days, req) {
        await this.validateAccountOwnership(accountId, req.user.tenantId);
        await this.unifiedSyncService.syncAccount(client_1.AdPlatform.GOOGLE_ADS, accountId, req.user.tenantId);
        return { success: true, message: 'Sync started' };
    }
};
exports.GoogleAdsCampaignController = GoogleAdsCampaignController;
__decorate([
    (0, common_1.Get)(':accountId/campaigns/fetch'),
    (0, swagger_1.ApiOperation)({ summary: 'Fetch campaigns from Google Ads (without saving)' }),
    (0, swagger_1.ApiParam)({ name: 'accountId', description: 'Google Ads Account ID' }),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsCampaignController.prototype, "fetchCampaigns", null);
__decorate([
    (0, common_1.Post)(':accountId/campaigns/sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync campaigns from Google Ads to database' }),
    (0, swagger_1.ApiParam)({ name: 'accountId', description: 'Google Ads Account ID' }),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsCampaignController.prototype, "syncCampaigns", null);
__decorate([
    (0, common_1.Post)(':accountId/campaigns/:campaignId/sync-metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync metrics for a specific campaign' }),
    (0, swagger_1.ApiParam)({ name: 'accountId', description: 'Google Ads Account ID' }),
    (0, swagger_1.ApiParam)({ name: 'campaignId', description: 'Campaign ID (internal database ID)' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Number of days to sync (default: 30)', type: Number }),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Param)('campaignId')),
    __param(2, (0, common_1.Query)('days')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsCampaignController.prototype, "syncCampaignMetrics", null);
__decorate([
    (0, common_1.Post)(':accountId/campaigns/sync-all-metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync metrics for all campaigns in an account' }),
    (0, swagger_1.ApiParam)({ name: 'accountId', description: 'Google Ads Account ID' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Number of days to sync (default: 30)', type: Number }),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsCampaignController.prototype, "syncAllCampaignMetrics", null);
exports.GoogleAdsCampaignController = GoogleAdsCampaignController = __decorate([
    (0, swagger_1.ApiTags)('integrations/google-ads'),
    (0, common_1.Controller)('integrations/google-ads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [google_ads_campaign_service_1.GoogleAdsCampaignService,
        prisma_service_1.PrismaService,
        unified_sync_service_1.UnifiedSyncService])
], GoogleAdsCampaignController);
//# sourceMappingURL=google-ads-campaign.controller.js.map