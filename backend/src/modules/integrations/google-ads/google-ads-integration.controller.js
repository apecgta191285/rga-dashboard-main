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
exports.GoogleAdsIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const google_ads_oauth_service_1 = require("./google-ads-oauth.service");
const unified_sync_service_1 = require("../../sync/unified-sync.service");
const client_1 = require("@prisma/client");
let GoogleAdsIntegrationController = class GoogleAdsIntegrationController {
    constructor(oauthService, unifiedSyncService) {
        this.oauthService = oauthService;
        this.unifiedSyncService = unifiedSyncService;
    }
    async getStatus(req) {
        const tenantId = req.user.tenantId;
        const result = await this.oauthService.getConnectedAccounts(tenantId);
        const mappedAccounts = result.accounts.map(account => ({
            id: account.id,
            externalId: account.customerId,
            name: account.accountName || 'Unnamed Account',
            status: account.status,
        }));
        const lastSyncAt = result.accounts.length > 0
            ? result.accounts
                .map(a => a.lastSyncAt)
                .filter(Boolean)
                .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null
            : null;
        return {
            isConnected: result.accounts.length > 0,
            lastSyncAt,
            accounts: mappedAccounts,
        };
    }
    async getAuthUrl(req) {
        const url = await this.oauthService.generateAuthUrl(req.user.id, req.user.tenantId);
        return { url };
    }
    async handleCallback(code, state) {
        return this.oauthService.handleCallback(code, state);
    }
    async getTempAccounts(tempToken) {
        return this.oauthService.getTempAccounts(tempToken);
    }
    async connectAccount(tempToken, customerId, req) {
        return this.oauthService.completeConnection(tempToken, customerId, req.user.tenantId);
    }
    async getConnectedAccounts(req) {
        return this.oauthService.getConnectedAccounts(req.user.tenantId);
    }
    async disconnect(req) {
        return this.oauthService.disconnect(req.user.tenantId);
    }
    async triggerSync(req) {
        const tenantId = req.user.tenantId;
        const result = await this.oauthService.getConnectedAccounts(tenantId);
        if (result.accounts.length === 0) {
            throw new common_1.BadRequestException('No Google Ads account connected');
        }
        const syncResults = [];
        for (const account of result.accounts) {
            await this.unifiedSyncService.syncAccount(client_1.AdPlatform.GOOGLE_ADS, account.id, tenantId);
            syncResults.push({ accountId: account.id, status: 'STARTED' });
        }
        return {
            success: true,
            message: 'Sync started for all connected accounts',
            results: syncResults
        };
    }
};
exports.GoogleAdsIntegrationController = GoogleAdsIntegrationController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check Google Ads integration status' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsIntegrationController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('auth-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Google Ads OAuth authorization URL' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsIntegrationController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Post)('oauth/callback'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle OAuth callback' }),
    __param(0, (0, common_1.Body)('code')),
    __param(1, (0, common_1.Body)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GoogleAdsIntegrationController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('temp-accounts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get temporary accounts for selection' }),
    __param(0, (0, common_1.Query)('tempToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoogleAdsIntegrationController.prototype, "getTempAccounts", null);
__decorate([
    (0, common_1.Post)('connect'),
    (0, swagger_1.ApiOperation)({ summary: 'Connect a Google Ads account' }),
    __param(0, (0, common_1.Body)('tempToken')),
    __param(1, (0, common_1.Body)('customerId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsIntegrationController.prototype, "connectAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get connected accounts' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsIntegrationController.prototype, "getConnectedAccounts", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect Google Ads integration' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsIntegrationController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual sync for Google Ads' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsIntegrationController.prototype, "triggerSync", null);
exports.GoogleAdsIntegrationController = GoogleAdsIntegrationController = __decorate([
    (0, swagger_1.ApiTags)('integrations/google-ads'),
    (0, common_1.Controller)('integrations/google-ads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [google_ads_oauth_service_1.GoogleAdsOAuthService,
        unified_sync_service_1.UnifiedSyncService])
], GoogleAdsIntegrationController);
//# sourceMappingURL=google-ads-integration.controller.js.map