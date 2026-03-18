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
exports.QueryCampaignsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class QueryCampaignsDto {
    constructor() {
        this.page = 1;
        this.limit = 10;
    }
}
exports.QueryCampaignsDto = QueryCampaignsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by campaign name or external ID' }),
    (0, class_transformer_1.Transform)(({ value }) => value === '' ? undefined : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryCampaignsDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by specific IDs (comma-separated)', example: 'uuid1,uuid2' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCampaignsDto.prototype, "ids", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by platform (GOOGLE_ADS, FACEBOOK, TIKTOK, etc.)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCampaignsDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by status (ACTIVE, PAUSED, DRAFT, etc.)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCampaignsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryCampaignsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 10 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QueryCampaignsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: [
            'name', 'createdAt', 'status', 'platform',
            'spend', 'impressions', 'clicks', 'revenue', 'conversions',
            'ctr', 'cpc', 'cpm', 'roas', 'roi'
        ],
        description: 'Field to sort by'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCampaignsDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['asc', 'desc'],
        description: 'Sort direction'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryCampaignsDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date for metrics aggregation (ISO 8601: YYYY-MM-DD)',
        example: '2026-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'startDate must be a valid ISO 8601 date string (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], QueryCampaignsDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'End date for metrics aggregation (ISO 8601: YYYY-MM-DD)',
        example: '2026-01-31',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'endDate must be a valid ISO 8601 date string (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], QueryCampaignsDto.prototype, "endDate", void 0);
//# sourceMappingURL=query-campaigns.dto.js.map