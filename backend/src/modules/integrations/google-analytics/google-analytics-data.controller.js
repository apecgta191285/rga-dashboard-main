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
exports.GoogleAnalyticsDataController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const google_analytics_service_1 = require("./google-analytics.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let GoogleAnalyticsDataController = class GoogleAnalyticsDataController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getBasicMetrics(tenantId, startDate, endDate) {
        return this.analyticsService.getBasicMetrics(tenantId, startDate, endDate);
    }
};
exports.GoogleAnalyticsDataController = GoogleAnalyticsDataController;
__decorate([
    (0, common_1.Get)('basic'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get basic GA4 metrics' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], GoogleAnalyticsDataController.prototype, "getBasicMetrics", null);
exports.GoogleAnalyticsDataController = GoogleAnalyticsDataController = __decorate([
    (0, swagger_1.ApiTags)('integrations/google-analytics'),
    (0, common_1.Controller)('integrations/google-analytics'),
    __metadata("design:paramtypes", [google_analytics_service_1.GoogleAnalyticsService])
], GoogleAnalyticsDataController);
//# sourceMappingURL=google-analytics-data.controller.js.map