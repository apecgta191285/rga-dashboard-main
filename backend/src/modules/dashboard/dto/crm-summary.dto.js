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
exports.CrmSummaryResponseDto = exports.GetCrmSummaryDto = exports.CrmPeriod = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var CrmPeriod;
(function (CrmPeriod) {
    CrmPeriod["D7"] = "7d";
    CrmPeriod["D30"] = "30d";
    CrmPeriod["THIS_MONTH"] = "this_month";
    CrmPeriod["LAST_MONTH"] = "last_month";
})(CrmPeriod || (exports.CrmPeriod = CrmPeriod = {}));
class GetCrmSummaryDto {
}
exports.GetCrmSummaryDto = GetCrmSummaryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CrmPeriod),
    (0, swagger_1.ApiProperty)({ enum: CrmPeriod, default: CrmPeriod.D30, required: false }),
    __metadata("design:type", String)
], GetCrmSummaryDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], GetCrmSummaryDto.prototype, "tenantId", void 0);
class CrmSummaryResponseDto {
}
exports.CrmSummaryResponseDto = CrmSummaryResponseDto;
//# sourceMappingURL=crm-summary.dto.js.map