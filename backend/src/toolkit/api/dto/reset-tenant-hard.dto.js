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
exports.ResetTenantHardDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const boolean_transformer_1 = require("./boolean-transformer");
class ResetTenantHardDto {
    constructor() {
        this.dryRun = true;
        this.confirmWrite = false;
    }
}
exports.ResetTenantHardDto = ResetTenantHardDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResetTenantHardDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResetTenantHardDto.prototype, "confirmationToken", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ResetTenantHardDto.prototype, "confirmedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(boolean_transformer_1.toOptionalBoolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResetTenantHardDto.prototype, "dryRun", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(boolean_transformer_1.toOptionalBoolean),
    (0, class_validator_1.ValidateIf)((dto) => dto.dryRun === false),
    (0, class_validator_1.Equals)(true, { message: 'confirmWrite must be true when dryRun is false' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResetTenantHardDto.prototype, "confirmWrite", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Equals)('HARD_RESET'),
    __metadata("design:type", String)
], ResetTenantHardDto.prototype, "destructiveAck", void 0);
//# sourceMappingURL=reset-tenant-hard.dto.js.map