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
var GoogleAnalyticsAuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAnalyticsAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const google_analytics_oauth_service_1 = require("./google-analytics-oauth.service");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let GoogleAnalyticsAuthController = GoogleAnalyticsAuthController_1 = class GoogleAnalyticsAuthController {
    constructor(oauthService, configService) {
        this.oauthService = oauthService;
        this.configService = configService;
        this.logger = new common_1.Logger(GoogleAnalyticsAuthController_1.name);
        this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    }
    async getAuthUrl(req) {
        const userId = req.user.id;
        const tenantId = req.user.tenantId;
        const authUrl = await this.oauthService.generateAuthUrl(userId, tenantId);
        return {
            authUrl,
            message: 'Open this URL in a browser to authorize Google Analytics access',
        };
    }
    async handleCallback(code, state, res) {
        try {
            if (!code) {
                return res.redirect(`${this.frontendUrl}/data-sources?error=missing_code`);
            }
            const result = await this.oauthService.handleCallback(code, state);
            return res.redirect(`${this.frontendUrl}/data-sources?status=${result.status}&tempToken=${result.tempToken}&platform=ga4`);
        }
        catch (error) {
            console.error('OAuth callback error:', error);
            return res.redirect(`${this.frontendUrl}/data-sources?error=${encodeURIComponent(error.message)}`);
        }
    }
    async getTempProperties(tempToken) {
        if (!tempToken) {
            throw new common_1.BadRequestException('Missing tempToken');
        }
        return this.oauthService.getTempProperties(tempToken);
    }
    async completeConnection(req, tempToken, propertyId) {
        const tenantId = req.user.tenantId;
        if (!tempToken || !propertyId) {
            throw new common_1.BadRequestException('Missing tempToken or propertyId');
        }
        return this.oauthService.completeConnection(tempToken, propertyId, tenantId);
    }
    async getStatus(tenantId) {
        this.logger.log(`[GA4 Status] Checking status for tenant ${tenantId}`);
        const status = await this.oauthService.getConnectionStatus(tenantId);
        this.logger.log(`[GA4 Status] Result: ${JSON.stringify(status)}`);
        return status;
    }
};
exports.GoogleAnalyticsAuthController = GoogleAnalyticsAuthController;
__decorate([
    (0, common_1.Get)('url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get Google Analytics OAuth authorization URL' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAnalyticsAuthController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Get)('callback'),
    (0, swagger_1.ApiOperation)({ summary: 'OAuth callback endpoint' }),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GoogleAnalyticsAuthController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('temp-properties'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get temporary properties list for selection' }),
    __param(0, (0, common_1.Query)('tempToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoogleAnalyticsAuthController.prototype, "getTempProperties", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Complete GA4 connection by selecting a property' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { tempToken: { type: 'string' }, propertyId: { type: 'string' } } } }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('tempToken')),
    __param(2, (0, common_1.Body)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], GoogleAnalyticsAuthController.prototype, "completeConnection", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get GA4 connection status' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoogleAnalyticsAuthController.prototype, "getStatus", null);
exports.GoogleAnalyticsAuthController = GoogleAnalyticsAuthController = GoogleAnalyticsAuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('auth/google/analytics'),
    (0, common_1.Controller)('auth/google/analytics'),
    __metadata("design:paramtypes", [google_analytics_oauth_service_1.GoogleAnalyticsOAuthService,
        config_1.ConfigService])
], GoogleAnalyticsAuthController);
//# sourceMappingURL=google-analytics-auth.controller.js.map