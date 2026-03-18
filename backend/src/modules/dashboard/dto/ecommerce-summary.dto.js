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
exports.EcommerceSummaryResponseDto = exports.GetEcommerceSummaryDto = exports.EcommercePeriod = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var EcommercePeriod;
(function (EcommercePeriod) {
    EcommercePeriod["D7"] = "7d";
    EcommercePeriod["D30"] = "30d";
    EcommercePeriod["THIS_MONTH"] = "this_month";
    EcommercePeriod["LAST_MONTH"] = "last_month";
})(EcommercePeriod || (exports.EcommercePeriod = EcommercePeriod = {}));
class GetEcommerceSummaryDto {
}
exports.GetEcommerceSummaryDto = GetEcommerceSummaryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EcommercePeriod),
    (0, swagger_1.ApiProperty)({ enum: EcommercePeriod, default: EcommercePeriod.D30, required: false }),
    __metadata("design:type", String)
], GetEcommerceSummaryDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], GetEcommerceSummaryDto.prototype, "tenantId", void 0);
class EcommerceSummaryResponseDto {
}
exports.EcommerceSummaryResponseDto = EcommerceSummaryResponseDto;
//# sourceMappingURL=ecommerce-summary.dto.js.map