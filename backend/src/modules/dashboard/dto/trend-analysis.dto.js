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
exports.TrendDataResponseDto = exports.GetTrendAnalysisDto = exports.TrendPeriod = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var TrendPeriod;
(function (TrendPeriod) {
    TrendPeriod["D7"] = "7d";
    TrendPeriod["D30"] = "30d";
    TrendPeriod["THIS_MONTH"] = "this_month";
    TrendPeriod["LAST_MONTH"] = "last_month";
})(TrendPeriod || (exports.TrendPeriod = TrendPeriod = {}));
class GetTrendAnalysisDto {
}
exports.GetTrendAnalysisDto = GetTrendAnalysisDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TrendPeriod),
    (0, swagger_1.ApiProperty)({ enum: TrendPeriod, default: TrendPeriod.D30, required: false }),
    __metadata("design:type", String)
], GetTrendAnalysisDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], GetTrendAnalysisDto.prototype, "tenantId", void 0);
class TrendDataResponseDto {
}
exports.TrendDataResponseDto = TrendDataResponseDto;
//# sourceMappingURL=trend-analysis.dto.js.map