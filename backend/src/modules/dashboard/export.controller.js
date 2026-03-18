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
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const export_service_1 = require("./export.service");
let ExportController = class ExportController {
    constructor(exportService) {
        this.exportService = exportService;
    }
    async exportCampaigns(tenantId, startDateStr, endDateStr, platform, status) {
        if (!startDateStr || !endDateStr) {
            throw new common_1.BadRequestException('startDate and endDate are required');
        }
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        if (isNaN(startDate.getTime())) {
            throw new common_1.BadRequestException('Invalid startDate format. Use YYYY-MM-DD.');
        }
        if (isNaN(endDate.getTime())) {
            throw new common_1.BadRequestException('Invalid endDate format. Use YYYY-MM-DD.');
        }
        if (startDate > endDate) {
            throw new common_1.BadRequestException('startDate must be before or equal to endDate');
        }
        const query = {
            startDate,
            endDate,
            platform,
            status,
        };
        return this.exportService.streamCampaignsCSV(tenantId, query);
    }
    async exportMetricsPDF(tenantId, period = '7d') {
        const pdf = await this.exportService.exportMetricsToPDF(tenantId, period);
        return pdf;
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)('campaigns'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export campaign performance report as CSV',
        description: 'Streams campaign data with aggregated metrics for the specified date range. Memory-efficient for large datasets.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: true,
        type: String,
        example: '2026-01-01',
        description: 'Start of date range (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: true,
        type: String,
        example: '2026-01-21',
        description: 'End of date range (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'platform',
        required: false,
        enum: ['GOOGLE_ADS', 'FACEBOOK', 'TIKTOK', 'LINE_ADS'],
        description: 'Filter by ad platform',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'DRAFT'],
        description: 'Filter by campaign status',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'CSV file download',
        content: {
            'text/csv': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid date parameters' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('platform')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportCampaigns", null);
__decorate([
    (0, common_1.Get)('metrics/pdf'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export metrics report as PDF',
        description: 'Generates a PDF report with summary metrics and daily breakdown.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'period',
        required: false,
        enum: ['7d', '30d'],
        description: 'Report period (default: 7d)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'PDF file download',
        content: {
            'application/pdf': {
                schema: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportMetricsPDF", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiTags)('Export'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map