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
exports.SeoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const seo_service_1 = require("./seo.service");
let SeoController = class SeoController {
    constructor(seoService) {
        this.seoService = seoService;
    }
    async getSummary(user) {
        return this.seoService.getSeoSummary(user.tenantId);
    }
    async getHistory(user, days) {
        return this.seoService.getSeoHistory(user.tenantId, days ? Number(days) : 30);
    }
    async getKeywordIntent(user) {
        return this.seoService.getSeoKeywordIntent(user.tenantId);
    }
    async getTrafficByLocation(user) {
        return this.seoService.getSeoTrafficByLocation(user.tenantId);
    }
    async getSeoOverview(tenantId, period) {
        return this.seoService.getOverview(tenantId, period);
    }
    async getSeoDashboard(tenantId, period, limit) {
        const limitNum = limit ? Math.max(1, parseInt(limit, 10) || 10) : 10;
        return this.seoService.getDashboard(tenantId, period, limitNum);
    }
    async syncGsc(tenantId, days) {
        const daysNum = days ? Math.max(1, parseInt(days, 10) || 30) : 30;
        return this.seoService.syncGscForTenant(tenantId, { days: daysNum });
    }
    async getTopKeywords(user) {
        return this.seoService.getTopKeywords(user.tenantId);
    }
    async getOffpageSnapshots(user) {
        return this.seoService.getOffpageSnapshots(user.tenantId);
    }
    async getAnchorTexts(user) {
        return this.seoService.getAnchorTexts(user.tenantId);
    }
    async getAiInsights(user) {
        return this.seoService.getAiInsights(user.tenantId);
    }
};
exports.SeoController = SeoController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SEO summary metrics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SEO history for chart' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('keyword-intent'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SEO keyword intent breakdown' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getKeywordIntent", null);
__decorate([
    (0, common_1.Get)('traffic-by-location'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SEO traffic by location' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getTrafficByLocation", null);
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SEO overview (GA4 + GSC)' }),
    (0, swagger_1.ApiQuery)({ name: 'period', required: false, description: 'Time period (7d, 14d, 30d, 90d). Default: 30d' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getSeoOverview", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SEO dashboard details (trends + top breakdown)' }),
    (0, swagger_1.ApiQuery)({ name: 'period', required: false, description: 'Time period (7d, 14d, 30d, 90d). Default: 30d' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Top N breakdown rows. Default: 10' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getSeoDashboard", null);
__decorate([
    (0, common_1.Post)('sync/gsc'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually sync Google Search Console data into DB' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'How many days back to sync. Default: 30' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "syncGsc", null);
__decorate([
    (0, common_1.Get)('top-keywords'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top organic keywords' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getTopKeywords", null);
__decorate([
    (0, common_1.Get)('offpage-snapshots'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SEO offpage snapshots' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getOffpageSnapshots", null);
__decorate([
    (0, common_1.Get)('anchor-texts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get SEO anchor texts' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getAnchorTexts", null);
__decorate([
    (0, common_1.Get)('ai-insights'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI insights for Google Assistant' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SeoController.prototype, "getAiInsights", null);
exports.SeoController = SeoController = __decorate([
    (0, swagger_1.ApiTags)('SEO'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('seo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [seo_service_1.SeoService])
], SeoController);
//# sourceMappingURL=seo.controller.js.map