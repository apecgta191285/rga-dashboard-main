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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const dashboard_service_1 = require("./dashboard.service");
const metrics_service_1 = require("./metrics.service");
const export_service_1 = require("./export.service");
const dashboard_overview_dto_1 = require("./dto/dashboard-overview.dto");
const tenant_cache_interceptor_1 = require("../../common/interceptors/tenant-cache.interceptor");
const integration_switch_service_1 = require("../data-sources/integration-switch.service");
const date_range_util_1 = require("../../common/utils/date-range.util");
let DashboardController = class DashboardController {
    constructor(dashboardService, metricsService, exportService, integrationSwitchService) {
        this.dashboardService = dashboardService;
        this.metricsService = metricsService;
        this.exportService = exportService;
        this.integrationSwitchService = integrationSwitchService;
    }
    async getOverview(user, query) {
        return this.integrationSwitchService.getDashboardOverview(user, query);
    }
    async getMetrics(tenantId, range, compare) {
        const period = range || '7d';
        const compareWith = compare === 'previous_period' ? 'previous_period' : undefined;
        return this.metricsService.getMetricsTrends(tenantId, period, compareWith);
    }
    async getSummary(req, days) {
        const daysNum = days ? parseInt(days, 10) : 30;
        return this.dashboardService.getSummary(req.user.tenantId, daysNum);
    }
    async getSummaryByPlatform(req, days, platform) {
        const daysNum = days ? parseInt(days, 10) : 30;
        const platformFilter = platform || 'ALL';
        return this.dashboardService.getSummaryByPlatform(req.user.tenantId, daysNum, platformFilter);
    }
    async getTopCampaigns(req, limit, days) {
        let limitNum = 5;
        if (limit) {
            const parsed = parseInt(limit, 10);
            if (!isNaN(parsed) && parsed > 0)
                limitNum = parsed;
        }
        const daysNum = days ? parseInt(days, 10) : 30;
        return this.integrationSwitchService.getTopCampaigns(req.user.tenantId, limitNum, daysNum);
    }
    async getTrends(req, days) {
        const daysNum = days ? parseInt(days, 10) : 30;
        return this.dashboardService.getTrends(req.user.tenantId, daysNum);
    }
    async getPerformanceByPlatform(req, startDate) {
        let days = 30;
        if (startDate && startDate.endsWith('d')) {
            days = parseInt(startDate.replace('d', ''), 10);
        }
        return this.dashboardService.getPerformanceByPlatform(req.user.tenantId, days);
    }
    async getTimeSeries(tenantId, metric, startDateStr, endDateStr) {
        const allowedMetrics = new Set([
            'impressions',
            'clicks',
            'spend',
            'conversions',
            'revenue',
            'sessions',
        ]);
        if (!metric || !allowedMetrics.has(metric)) {
            throw new common_1.BadRequestException('Invalid metric. Allowed: impressions, clicks, spend, conversions, revenue, sessions');
        }
        let startDate;
        let endDate;
        if (startDateStr || endDateStr) {
            if (!startDateStr || !endDateStr) {
                throw new common_1.BadRequestException('startDate and endDate must be provided together');
            }
            startDate = new Date(startDateStr);
            endDate = new Date(endDateStr);
            if (isNaN(startDate.getTime())) {
                throw new common_1.BadRequestException('Invalid startDate format. Use YYYY-MM-DD.');
            }
            if (isNaN(endDate.getTime())) {
                throw new common_1.BadRequestException('Invalid endDate format. Use YYYY-MM-DD.');
            }
            if (startDate > endDate) {
                throw new common_1.BadRequestException('startDate must be before or equal to endDate');
            }
        }
        else {
            const range30 = date_range_util_1.DateRangeUtil.getDateRange(30);
            startDate = range30.startDate;
            endDate = range30.endDate;
        }
        return this.metricsService.getTimeSeries(tenantId, metric, startDate, endDate);
    }
    async getMetricsTrends(user, period = '7d', compare) {
        return this.metricsService.getMetricsTrends(user.tenantId, period, compare);
    }
    async getDailyMetrics(user, period = '7d') {
        return this.metricsService.getDailyMetrics(user.tenantId, period);
    }
    async exportCampaignsCSV(user, platform, status) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        return this.exportService.streamCampaignsCSV(user.tenantId, {
            startDate,
            endDate,
            platform,
            status,
        });
    }
    async exportMetricsPDF(user, period = '7d', res) {
        const pdf = await this.exportService.exportMetricsToPDF(user.tenantId, period);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=metrics-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
        res.send(pdf);
    }
    async getOnboardingStatus(tenantId) {
        return this.dashboardService.getOnboardingStatus(tenantId);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard overview data (Smart Switch: Demo vs Live)' }),
    (0, swagger_1.ApiQuery)({ name: 'period', enum: dashboard_overview_dto_1.PeriodEnum, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tenantId', required: false, description: 'Tenant override (SUPER_ADMIN only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard overview data', type: dashboard_overview_dto_1.DashboardOverviewResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dashboard_overview_dto_1.GetDashboardOverviewDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('range')),
    __param(2, (0, common_1.Query)('compare')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('summary-by-platform'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Query)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSummaryByPlatform", null);
__decorate([
    (0, common_1.Get)('top-campaigns'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTopCampaigns", null);
__decorate([
    (0, common_1.Get)('trends'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('performance-by-platform'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getPerformanceByPlatform", null);
__decorate([
    (0, common_1.Get)('time-series'),
    (0, swagger_1.ApiOperation)({ summary: 'Get time-series for a single metric' }),
    (0, swagger_1.ApiQuery)({ name: 'metric', required: true, description: 'Metric name (impressions, clicks, spend, conversions, revenue, sessions)' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD). If omitted, defaults to last 30 days.' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD). If omitted, defaults to today.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time-series data' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('metric')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getTimeSeries", null);
__decorate([
    (0, common_1.Get)('metrics/trends'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('compare')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMetricsTrends", null);
__decorate([
    (0, common_1.Get)('metrics/daily'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDailyMetrics", null);
__decorate([
    (0, common_1.Get)('export/campaigns/csv'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('platform')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "exportCampaignsCSV", null);
__decorate([
    (0, common_1.Get)('export/metrics/pdf'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "exportMetricsPDF", null);
__decorate([
    (0, common_1.Get)('onboarding-status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOnboardingStatus", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)(tenant_cache_interceptor_1.TenantCacheInterceptor),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        metrics_service_1.MetricsService,
        export_service_1.ExportService,
        integration_switch_service_1.IntegrationSwitchService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map