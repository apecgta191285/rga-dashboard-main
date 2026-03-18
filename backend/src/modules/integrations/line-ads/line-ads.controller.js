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
exports.LineAdsController = void 0;
const common_1 = require("@nestjs/common");
const line_ads_oauth_service_1 = require("./line-ads-oauth.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const config_1 = require("@nestjs/config");
let LineAdsController = class LineAdsController {
    constructor(lineAdsOAuthService, configService) {
        this.lineAdsOAuthService = lineAdsOAuthService;
        this.configService = configService;
        this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    }
    getAuthUrl(req) {
        const userId = req.user.id;
        const tenantId = req.user.tenantId;
        const url = this.lineAdsOAuthService.generateAuthUrl(userId, tenantId);
        return { url };
    }
    async handleCallback(code, state, res) {
        try {
            await this.lineAdsOAuthService.handleCallback(code, state);
            return res.redirect(`${this.frontendUrl}/data-sources?status=success&platform=line`);
        }
        catch (error) {
            const errorMessage = encodeURIComponent(error?.message || 'Unknown error');
            return res.redirect(`${this.frontendUrl}/data-sources?status=error&message=${errorMessage}&platform=line`);
        }
    }
};
exports.LineAdsController = LineAdsController;
__decorate([
    (0, common_1.Get)('url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LineAdsController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LineAdsController.prototype, "handleCallback", null);
exports.LineAdsController = LineAdsController = __decorate([
    (0, common_1.Controller)('auth/line'),
    __metadata("design:paramtypes", [line_ads_oauth_service_1.LineAdsOAuthService,
        config_1.ConfigService])
], LineAdsController);
//# sourceMappingURL=line-ads.controller.js.map