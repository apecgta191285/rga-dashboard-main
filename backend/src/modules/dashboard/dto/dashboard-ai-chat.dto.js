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
exports.DashboardAiChatResponseDto = exports.DashboardAiChatMetaDto = exports.DashboardAiChatDataDto = exports.DashboardAiChatEvidenceDto = exports.DashboardAiChatRequestDto = exports.DashboardAiChatQueryType = exports.DashboardAiChatIntent = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const dashboard_overview_dto_1 = require("./dashboard-overview.dto");
var DashboardAiChatIntent;
(function (DashboardAiChatIntent) {
    DashboardAiChatIntent["SUMMARY"] = "SUMMARY";
    DashboardAiChatIntent["REVENUE"] = "REVENUE";
    DashboardAiChatIntent["OVER_BUDGET"] = "OVER_BUDGET";
    DashboardAiChatIntent["CPC"] = "CPC";
    DashboardAiChatIntent["PERFORMANCE"] = "PERFORMANCE";
    DashboardAiChatIntent["TOP_CAMPAIGN"] = "TOP_CAMPAIGN";
    DashboardAiChatIntent["OUT_OF_SCOPE"] = "OUT_OF_SCOPE";
})(DashboardAiChatIntent || (exports.DashboardAiChatIntent = DashboardAiChatIntent = {}));
var DashboardAiChatQueryType;
(function (DashboardAiChatQueryType) {
    DashboardAiChatQueryType["SQL"] = "SQL";
    DashboardAiChatQueryType["ANALYSIS"] = "ANALYSIS";
})(DashboardAiChatQueryType || (exports.DashboardAiChatQueryType = DashboardAiChatQueryType = {}));
class DashboardAiChatRequestDto {
    constructor() {
        this.period = dashboard_overview_dto_1.PeriodEnum.SEVEN_DAYS;
    }
}
exports.DashboardAiChatRequestDto = DashboardAiChatRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'เนเธเธฃเธเธเธฒเธฃเนเธซเธเธเธณเธฅเธฑเธเนเธเนเธ—เธฃเธฑเธเธขเธฒเธเธฃเน€เธเธดเธเธเธ?',
        description: 'Natural language question (Thai/English)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], DashboardAiChatRequestDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: dashboard_overview_dto_1.PeriodEnum,
        default: dashboard_overview_dto_1.PeriodEnum.SEVEN_DAYS,
        description: 'Time period for analytics scope',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(dashboard_overview_dto_1.PeriodEnum, {
        message: 'period must be one of: 7d, 30d, this_month, last_month',
    }),
    __metadata("design:type", String)
], DashboardAiChatRequestDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tenant ID override (SUPER_ADMIN only)',
        format: 'uuid',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'tenantId must be a valid UUID' }),
    __metadata("design:type", String)
], DashboardAiChatRequestDto.prototype, "tenantId", void 0);
class DashboardAiChatEvidenceDto {
}
exports.DashboardAiChatEvidenceDto = DashboardAiChatEvidenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cost' }),
    __metadata("design:type", String)
], DashboardAiChatEvidenceDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'เธฟ58,231' }),
    __metadata("design:type", String)
], DashboardAiChatEvidenceDto.prototype, "value", void 0);
class DashboardAiChatDataDto {
}
exports.DashboardAiChatDataDto = DashboardAiChatDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'เนเธเธฃเธเธเธฒเธฃเนเธซเธเธเธณเธฅเธฑเธเนเธเนเธ—เธฃเธฑเธเธขเธฒเธเธฃเน€เธเธดเธเธเธ?' }),
    __metadata("design:type", String)
], DashboardAiChatDataDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: DashboardAiChatIntent, example: DashboardAiChatIntent.OVER_BUDGET }),
    __metadata("design:type", String)
], DashboardAiChatDataDto.prototype, "intent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: DashboardAiChatQueryType, example: DashboardAiChatQueryType.SQL }),
    __metadata("design:type", String)
], DashboardAiChatDataDto.prototype, "queryType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'เนเธเธกเน€เธเธ Brand Search เนเธเนเธเธ 124.3% เธเธญเธ budget เนเธเธเนเธงเธเน€เธงเธฅเธฒเธ—เธตเนเน€เธฅเธทเธญเธ',
    }),
    __metadata("design:type", String)
], DashboardAiChatDataDto.prototype, "answer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: "SELECT name, budget, spending FROM campaigns WHERE tenant_id = '...' ORDER BY spending DESC LIMIT 3;",
    }),
    __metadata("design:type", String)
], DashboardAiChatDataDto.prototype, "generatedQuery", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DashboardAiChatEvidenceDto] }),
    __metadata("design:type", Array)
], DashboardAiChatDataDto.prototype, "evidence", void 0);
class DashboardAiChatMetaDto {
}
exports.DashboardAiChatMetaDto = DashboardAiChatMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: dashboard_overview_dto_1.PeriodEnum, example: dashboard_overview_dto_1.PeriodEnum.SEVEN_DAYS }),
    __metadata("design:type", String)
], DashboardAiChatMetaDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], DashboardAiChatMetaDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-16T09:10:11.000Z' }),
    __metadata("design:type", String)
], DashboardAiChatMetaDto.prototype, "generatedAt", void 0);
class DashboardAiChatResponseDto {
}
exports.DashboardAiChatResponseDto = DashboardAiChatResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], DashboardAiChatResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: DashboardAiChatDataDto }),
    __metadata("design:type", DashboardAiChatDataDto)
], DashboardAiChatResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: DashboardAiChatMetaDto }),
    __metadata("design:type", DashboardAiChatMetaDto)
], DashboardAiChatResponseDto.prototype, "meta", void 0);
//# sourceMappingURL=dashboard-ai-chat.dto.js.map