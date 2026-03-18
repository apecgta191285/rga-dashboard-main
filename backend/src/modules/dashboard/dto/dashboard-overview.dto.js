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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardOverviewResponseDto = exports.DashboardOverviewDataDto = exports.ResponseMetaDto = exports.RecentCampaignDto = exports.TrendDataPointDto = exports.GrowthMetricsDto = exports.SummaryMetricsDto = exports.GetDashboardOverviewDto = exports.PeriodEnum = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
var PeriodEnum;
(function (PeriodEnum) {
    PeriodEnum["SEVEN_DAYS"] = "7d";
    PeriodEnum["THIRTY_DAYS"] = "30d";
    PeriodEnum["THIS_MONTH"] = "this_month";
    PeriodEnum["LAST_MONTH"] = "last_month";
})(PeriodEnum || (exports.PeriodEnum = PeriodEnum = {}));
class GetDashboardOverviewDto {
    constructor() {
        this.period = PeriodEnum.SEVEN_DAYS;
    }
}
exports.GetDashboardOverviewDto = GetDashboardOverviewDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: PeriodEnum,
        default: PeriodEnum.SEVEN_DAYS,
        description: 'Time period for aggregation (ignored if startDate/endDate provided)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PeriodEnum, {
        message: 'period must be one of: 7d, 30d, this_month, last_month',
    }),
    __metadata("design:type", String)
], GetDashboardOverviewDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom start date (YYYY-MM-DD). If provided, endDate must also be provided.',
        example: '2026-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'startDate must be a valid date string (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], GetDashboardOverviewDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom end date (YYYY-MM-DD). If provided, startDate must also be provided.',
        example: '2026-01-31',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'endDate must be a valid date string (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], GetDashboardOverviewDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tenant ID override (SUPER_ADMIN only)',
        format: 'uuid',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'tenantId must be a valid UUID' }),
    __metadata("design:type", String)
], GetDashboardOverviewDto.prototype, "tenantId", void 0);
class SummaryMetricsDto {
}
exports.SummaryMetricsDto = SummaryMetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 455000 }),
    __metadata("design:type", Number)
], SummaryMetricsDto.prototype, "totalImpressions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 18500 }),
    __metadata("design:type", Number)
], SummaryMetricsDto.prototype, "totalClicks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 42500.0 }),
    __metadata("design:type", Number)
], SummaryMetricsDto.prototype, "totalCost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 625 }),
    __metadata("design:type", Number)
], SummaryMetricsDto.prototype, "totalConversions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4.07, description: 'Calculated CTR percentage' }),
    __metadata("design:type", Number)
], SummaryMetricsDto.prototype, "averageCtr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3.85, description: 'Calculated ROAS' }),
    __metadata("design:type", Number)
], SummaryMetricsDto.prototype, "averageRoas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 93.4, description: 'Calculated CPM (cost per 1,000 impressions)' }),
    __metadata("design:type", Number)
], SummaryMetricsDto.prototype, "averageCpm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 128.0, description: 'Calculated ROI percentage ((revenue - cost) / cost * 100)' }),
    __metadata("design:type", Number)
], SummaryMetricsDto.prototype, "averageRoi", void 0);
class GrowthMetricsDto {
}
exports.GrowthMetricsDto = GrowthMetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12.5, nullable: true }),
    __metadata("design:type", Number)
], GrowthMetricsDto.prototype, "impressionsGrowth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8.3, nullable: true }),
    __metadata("design:type", Number)
], GrowthMetricsDto.prototype, "clicksGrowth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -5.2, nullable: true }),
    __metadata("design:type", Number)
], GrowthMetricsDto.prototype, "costGrowth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15.7, nullable: true }),
    __metadata("design:type", Number)
], GrowthMetricsDto.prototype, "conversionsGrowth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.6, nullable: true, description: 'CTR percentage growth vs previous period' }),
    __metadata("design:type", Number)
], GrowthMetricsDto.prototype, "ctrGrowth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -3.2, nullable: true, description: 'CPM growth vs previous period' }),
    __metadata("design:type", Number)
], GrowthMetricsDto.prototype, "cpmGrowth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4.1, nullable: true, description: 'ROAS growth vs previous period' }),
    __metadata("design:type", Number)
], GrowthMetricsDto.prototype, "roasGrowth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2.1, nullable: true, description: 'ROI percentage growth vs previous period' }),
    __metadata("design:type", Number)
], GrowthMetricsDto.prototype, "roiGrowth", void 0);
class TrendDataPointDto {
}
exports.TrendDataPointDto = TrendDataPointDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-01-15' }),
    __metadata("design:type", String)
], TrendDataPointDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 65000 }),
    __metadata("design:type", Number)
], TrendDataPointDto.prototype, "impressions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2650 }),
    __metadata("design:type", Number)
], TrendDataPointDto.prototype, "clicks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 6100.0 }),
    __metadata("design:type", Number)
], TrendDataPointDto.prototype, "cost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 95 }),
    __metadata("design:type", Number)
], TrendDataPointDto.prototype, "conversions", void 0);
class RecentCampaignDto {
}
exports.RecentCampaignDto = RecentCampaignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440001' }),
    __metadata("design:type", String)
], RecentCampaignDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Summer Sale 2026' }),
    __metadata("design:type", String)
], RecentCampaignDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CampaignStatus, example: 'ACTIVE' }),
    __metadata("design:type", String)
], RecentCampaignDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AdPlatform, example: 'GOOGLE_ADS' }),
    __metadata("design:type", String)
], RecentCampaignDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28500.0 }),
    __metadata("design:type", Number)
], RecentCampaignDto.prototype, "spending", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150000, description: 'Total impressions for this campaign in selected period' }),
    __metadata("design:type", Number)
], RecentCampaignDto.prototype, "impressions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000, description: 'Total clicks for this campaign in selected period' }),
    __metadata("design:type", Number)
], RecentCampaignDto.prototype, "clicks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 625, description: 'Total conversions for this campaign in selected period' }),
    __metadata("design:type", Number)
], RecentCampaignDto.prototype, "conversions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 57.0, required: false }),
    __metadata("design:type", Number)
], RecentCampaignDto.prototype, "budgetUtilization", void 0);
class ResponseMetaDto {
}
exports.ResponseMetaDto = ResponseMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PeriodEnum, example: '7d' }),
    __metadata("design:type", String)
], ResponseMetaDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { from: '2026-01-09', to: '2026-01-15' },
    }),
    __metadata("design:type", Object)
], ResponseMetaDto.prototype, "dateRange", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], ResponseMetaDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-01-15T11:06:26+07:00' }),
    __metadata("design:type", String)
], ResponseMetaDto.prototype, "generatedAt", void 0);
class DashboardOverviewDataDto {
}
exports.DashboardOverviewDataDto = DashboardOverviewDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: SummaryMetricsDto }),
    __metadata("design:type", SummaryMetricsDto)
], DashboardOverviewDataDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: GrowthMetricsDto }),
    __metadata("design:type", GrowthMetricsDto)
], DashboardOverviewDataDto.prototype, "growth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TrendDataPointDto] }),
    __metadata("design:type", Array)
], DashboardOverviewDataDto.prototype, "trends", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [RecentCampaignDto] }),
    __metadata("design:type", Array)
], DashboardOverviewDataDto.prototype, "recentCampaigns", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    __metadata("design:type", Boolean)
], DashboardOverviewDataDto.prototype, "isDemo", void 0);
class DashboardOverviewResponseDto {
}
exports.DashboardOverviewResponseDto = DashboardOverviewResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], DashboardOverviewResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: DashboardOverviewDataDto }),
    __metadata("design:type", DashboardOverviewDataDto)
], DashboardOverviewResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ResponseMetaDto }),
    __metadata("design:type", ResponseMetaDto)
], DashboardOverviewResponseDto.prototype, "meta", void 0);
//# sourceMappingURL=dashboard-overview.dto.js.map