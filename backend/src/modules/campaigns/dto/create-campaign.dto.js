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
exports.CreateCampaignDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateCampaignDto {
}
exports.CreateCampaignDto = CreateCampaignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Summer Sale 2024' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AdPlatform }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return value;
        const upper = value.toUpperCase();
        if (upper === 'GOOGLE')
            return 'GOOGLE_ADS';
        if (upper === 'LINE')
            return 'LINE_ADS';
        return upper;
    }),
    (0, class_validator_1.IsEnum)(client_1.AdPlatform),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CampaignStatus, example: 'ACTIVE' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.toUpperCase()),
    (0, class_validator_1.IsEnum)(client_1.CampaignStatus),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateCampaignDto.prototype, "budget", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-12-31', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'google_ads_campaign_123', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCampaignDto.prototype, "externalId", void 0);
//# sourceMappingURL=create-campaign.dto.js.map