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
exports.TikTokAdsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const tiktok_ads_oauth_service_1 = require("./tiktok-ads-oauth.service");
let TikTokAdsController = class TikTokAdsController {
    constructor(oauthService, configService) {
        this.oauthService = oauthService;
        this.configService = configService;
        this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    }
    getAuthUrl(req) {
        const userId = req.user.id;
        const tenantId = req.user.tenantId;
        if (this.oauthService.isSandboxMode()) {
            return {
                isSandbox: true,
                message: 'Sandbox mode enabled. Use POST /auth/tiktok/connect-sandbox to connect with pre-configured credentials.',
                connectEndpoint: '/auth/tiktok/connect-sandbox',
            };
        }
        const url = this.oauthService.generateAuthUrl(userId, tenantId);
        return {
            isSandbox: false,
            url,
            message: 'Open this URL in a browser to authorize TikTok Ads access',
        };
    }
    async handleCallback(code, state, res) {
        try {
            if (!code) {
                return res.redirect(`${this.frontendUrl}/data-sources?error=missing_code&platform=tiktok`);
            }
            if (!state) {
                return res.redirect(`${this.frontendUrl}/data-sources?error=missing_state&platform=tiktok`);
            }
            const result = await this.oauthService.handleCallback(code, state);
            return res.redirect(`${this.frontendUrl}/data-sources?status=${result.status}&tempToken=${result.tempToken}&platform=tiktok`);
        }
        catch (error) {
            console.error('[TikTok OAuth] Callback error:', error);
            return res.redirect(`${this.frontendUrl}/data-sources?error=${encodeURIComponent(error.message)}&platform=tiktok`);
        }
    }
    async getTempAccounts(tempToken) {
        if (!tempToken) {
            throw new common_1.BadRequestException('Missing tempToken parameter');
        }
        const accounts = await this.oauthService.getTempAccounts(tempToken);
        return {
            success: true,
            accounts,
            count: accounts.length,
        };
    }
    async completeConnection(req, tempToken, advertiserId) {
        const tenantId = req.user.tenantId;
        if (!tempToken) {
            throw new common_1.BadRequestException('Missing tempToken');
        }
        if (!advertiserId) {
            throw new common_1.BadRequestException('Missing advertiserId');
        }
        return this.oauthService.completeConnection(tempToken, advertiserId, tenantId);
    }
    async connectSandbox(req) {
        const tenantId = req.user.tenantId;
        return this.oauthService.connectSandbox(tenantId);
    }
    async getConnectedAccounts(req) {
        const tenantId = req.user.tenantId;
        const accounts = await this.oauthService.getConnectedAccounts(tenantId);
        return {
            success: true,
            accounts,
            count: accounts.length,
        };
    }
    async disconnect(req) {
        const tenantId = req.user.tenantId;
        await this.oauthService.disconnect(tenantId);
        return {
            success: true,
            message: 'TikTok Ads disconnected successfully',
        };
    }
    async refreshToken(req, accountId) {
        const tenantId = req.user.tenantId;
        if (!accountId) {
            throw new common_1.BadRequestException('Missing accountId');
        }
        await this.oauthService.refreshAccessToken(accountId, tenantId);
        return {
            success: true,
            message: 'Token refreshed successfully',
        };
    }
};
exports.TikTokAdsController = TikTokAdsController;
__decorate([
    (0, common_1.Get)('url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get TikTok OAuth URL or sandbox mode info' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns OAuth URL or sandbox connection info',
        schema: {
            oneOf: [
                {
                    properties: {
                        isSandbox: { type: 'boolean', example: false },
                        url: { type: 'string', example: 'https://ads.tiktok.com/marketing_api/auth?...' },
                    },
                },
                {
                    properties: {
                        isSandbox: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        connectEndpoint: { type: 'string', example: '/auth/tiktok/connect-sandbox' },
                    },
                },
            ],
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TikTokAdsController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Get)('callback'),
    (0, swagger_1.ApiOperation)({ summary: 'TikTok OAuth callback endpoint' }),
    (0, swagger_1.ApiQuery)({ name: 'code', required: true, description: 'Authorization code from TikTok' }),
    (0, swagger_1.ApiQuery)({ name: 'state', required: true, description: 'State parameter for CSRF protection' }),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TikTokAdsController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('temp-accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get temporary accounts list for selection' }),
    (0, swagger_1.ApiQuery)({ name: 'tempToken', required: true, description: 'Temporary token from OAuth callback' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of available TikTok advertiser accounts',
        schema: {
            type: 'array',
            items: {
                properties: {
                    id: { type: 'string', example: '7123456789012345678' },
                    name: { type: 'string', example: 'My Advertiser Account' },
                    status: { type: 'string', example: 'ACTIVE' },
                },
            },
        },
    }),
    __param(0, (0, common_1.Query)('tempToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TikTokAdsController.prototype, "getTempAccounts", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Complete TikTok connection by selecting an account' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['tempToken', 'advertiserId'],
            properties: {
                tempToken: { type: 'string', description: 'Temporary token from OAuth callback' },
                advertiserId: { type: 'string', description: 'Selected advertiser ID' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Connection completed successfully',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                accountId: { type: 'string' },
                accountName: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('tempToken')),
    __param(2, (0, common_1.Body)('advertiserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TikTokAdsController.prototype, "completeConnection", null);
__decorate([
    (0, common_1.Post)('connect-sandbox'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Connect TikTok Sandbox account (Sandbox mode only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sandbox account connected successfully',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                accountId: { type: 'string' },
                accountName: { type: 'string', example: 'TikTok Sandbox Account' },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TikTokAdsController.prototype, "connectSandbox", null);
__decorate([
    (0, common_1.Get)('accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get connected TikTok Ads accounts' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of connected accounts',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                accounts: {
                    type: 'array',
                    items: {
                        properties: {
                            id: { type: 'string' },
                            advertiserId: { type: 'string' },
                            accountName: { type: 'string' },
                            status: { type: 'string' },
                            lastSyncAt: { type: 'string', format: 'date-time', nullable: true },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
                count: { type: 'number' },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TikTokAdsController.prototype, "getConnectedAccounts", null);
__decorate([
    (0, common_1.Delete)('disconnect'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect TikTok Ads integration' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Disconnected successfully',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'TikTok Ads disconnected successfully' },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TikTokAdsController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Manually refresh access token for an account' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['accountId'],
            properties: {
                accountId: { type: 'string', description: 'Database account ID (not advertiserId)' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token refreshed successfully',
        schema: {
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Token refreshed successfully' },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TikTokAdsController.prototype, "refreshToken", null);
exports.TikTokAdsController = TikTokAdsController = __decorate([
    (0, swagger_1.ApiTags)('TikTok Ads Auth'),
    (0, common_1.Controller)('auth/tiktok'),
    __metadata("design:paramtypes", [tiktok_ads_oauth_service_1.TikTokAdsOAuthService,
        config_1.ConfigService])
], TikTokAdsController);
//# sourceMappingURL=tiktok-ads.controller.js.map