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
exports.GoogleAdsAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const google_ads_oauth_service_1 = require("./google-ads-oauth.service");
let GoogleAdsAuthController = class GoogleAdsAuthController {
    constructor(oauthService, configService) {
        this.oauthService = oauthService;
        this.configService = configService;
        this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    }
    async getAuthUrl(req) {
        const userId = req.user.id;
        const tenantId = req.user.tenantId;
        const authUrl = await this.oauthService.generateAuthUrl(userId, tenantId);
        return {
            authUrl,
            message: 'Open this URL in a browser to authorize Google Ads access',
        };
    }
    async handleCallback(code, state, res) {
        try {
            if (!code) {
                return res.redirect(`${this.frontendUrl}/data-sources?error=missing_code`);
            }
            const result = await this.oauthService.handleCallback(code, state);
            return res.redirect(`${this.frontendUrl}/data-sources?status=${result.status}&tempToken=${result.tempToken}&platform=ads`);
        }
        catch (error) {
            console.error('OAuth callback error:', error);
            return res.redirect(`${this.frontendUrl}/data-sources?error=${encodeURIComponent(error.message)}`);
        }
    }
    async getTempAccounts(tempToken) {
        if (!tempToken) {
            throw new common_1.BadRequestException('Missing tempToken');
        }
        return this.oauthService.getTempAccounts(tempToken);
    }
    async completeConnection(req, tempToken, customerId) {
        const tenantId = req.user.tenantId;
        if (!tempToken || !customerId) {
            throw new common_1.BadRequestException('Missing tempToken or customerId');
        }
        return this.oauthService.completeConnection(tempToken, customerId, tenantId);
    }
    async getConnectedAccounts(req) {
        const tenantId = req.user.tenantId;
        return this.oauthService.getConnectedAccounts(tenantId);
    }
};
exports.GoogleAdsAuthController = GoogleAdsAuthController;
__decorate([
    (0, common_1.Get)('url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get Google Ads OAuth authorization URL' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsAuthController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Get)('callback'),
    (0, swagger_1.ApiOperation)({ summary: 'OAuth callback endpoint' }),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsAuthController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('temp-accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get temporary accounts list for selection' }),
    __param(0, (0, common_1.Query)('tempToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoogleAdsAuthController.prototype, "getTempAccounts", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Complete Google Ads connection by selecting an account' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { tempToken: { type: 'string' }, customerId: { type: 'string' } } } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('tempToken')),
    __param(2, (0, common_1.Body)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], GoogleAdsAuthController.prototype, "completeConnection", null);
__decorate([
    (0, common_1.Get)('accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get connected Google Ads accounts' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAdsAuthController.prototype, "getConnectedAccounts", null);
exports.GoogleAdsAuthController = GoogleAdsAuthController = __decorate([
    (0, swagger_1.ApiTags)('auth/google/ads'),
    (0, common_1.Controller)('auth/google/ads'),
    __metadata("design:paramtypes", [google_ads_oauth_service_1.GoogleAdsOAuthService,
        config_1.ConfigService])
], GoogleAdsAuthController);
//# sourceMappingURL=google-ads-auth.controller.js.map