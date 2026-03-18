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
exports.FacebookAdsIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const facebook_ads_oauth_service_1 = require("./facebook-ads-oauth.service");
let FacebookAdsIntegrationController = class FacebookAdsIntegrationController {
    constructor(oauthService) {
        this.oauthService = oauthService;
    }
    async getStatus(req) {
        const tenantId = req.user.tenantId;
        const accounts = await this.oauthService.getConnectedAccounts(tenantId);
        const mappedAccounts = accounts.map(account => ({
            id: account.id,
            externalId: account.accountId,
            name: account.accountName || 'Unnamed Account',
            status: account.status,
        }));
        const lastSyncAt = accounts.length > 0
            ? accounts
                .map(a => a.lastSyncAt)
                .filter(Boolean)
                .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null
            : null;
        return {
            isConnected: accounts.length > 0,
            lastSyncAt,
            accounts: mappedAccounts,
        };
    }
    async getConnectedAccounts(req) {
        const tenantId = req.user.tenantId;
        const accounts = await this.oauthService.getConnectedAccounts(tenantId);
        return {
            accounts: accounts.map(account => ({
                id: account.id,
                externalId: account.accountId,
                name: account.accountName || 'Unnamed Account',
                status: account.status,
                lastSyncAt: account.lastSyncAt,
                createdAt: account.createdAt,
            })),
        };
    }
    async disconnect(req) {
        const tenantId = req.user.tenantId;
        await this.oauthService.disconnect(tenantId);
        return {
            success: true,
            message: 'Facebook Ads disconnected successfully',
        };
    }
};
exports.FacebookAdsIntegrationController = FacebookAdsIntegrationController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check Facebook Ads integration status' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Integration status with connected accounts',
        schema: {
            properties: {
                isConnected: { type: 'boolean', example: true },
                lastSyncAt: { type: 'string', format: 'date-time', nullable: true },
                accounts: {
                    type: 'array',
                    items: {
                        properties: {
                            id: { type: 'string', description: 'Internal DB ID' },
                            externalId: { type: 'string', description: 'Facebook Account ID (act_xxx)' },
                            name: { type: 'string', description: 'Account display name' },
                            status: { type: 'string', example: 'ACTIVE' },
                        },
                    },
                },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FacebookAdsIntegrationController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('accounts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get connected Facebook Ads accounts' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FacebookAdsIntegrationController.prototype, "getConnectedAccounts", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect Facebook Ads integration' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successfully disconnected',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Facebook Ads disconnected successfully' },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FacebookAdsIntegrationController.prototype, "disconnect", null);
exports.FacebookAdsIntegrationController = FacebookAdsIntegrationController = __decorate([
    (0, swagger_1.ApiTags)('integrations/facebook-ads'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('integrations/facebook-ads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [facebook_ads_oauth_service_1.FacebookAdsOAuthService])
], FacebookAdsIntegrationController);
//# sourceMappingURL=facebook-ads-integration.controller.js.map