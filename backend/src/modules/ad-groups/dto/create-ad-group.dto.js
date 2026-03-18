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
exports.CreateAdGroupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateAdGroupDto {
}
exports.CreateAdGroupDto = CreateAdGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ad Group - Thailand Audience', description: 'Ad group name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAdGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Parent Campaign ID (UUID)' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAdGroupDto.prototype, "campaignId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.AdGroupStatus, default: 'ACTIVE', description: 'Ad group status' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    (0, class_validator_1.IsEnum)(client_1.AdGroupStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAdGroupDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5000, description: 'Budget in THB' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAdGroupDto.prototype, "budget", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2.50, description: 'Bid amount per click/impression' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateAdGroupDto.prototype, "bidAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'CPC', description: 'Bid type (CPC, CPM, CPA)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAdGroupDto.prototype, "bidType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Targeting configuration (JSON object)' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAdGroupDto.prototype, "targeting", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'ext_adgroup_123', description: 'External platform ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAdGroupDto.prototype, "externalId", void 0);
//# sourceMappingURL=create-ad-group.dto.js.map