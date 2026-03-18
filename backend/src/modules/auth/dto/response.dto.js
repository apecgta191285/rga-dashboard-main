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
exports.RefreshResponseDto = exports.AuthResponseDto = exports.AuthTokensDto = exports.UserResponseDto = exports.TenantDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class TenantDto {
}
exports.TenantDto = TenantDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], TenantDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'RGA Company' }),
    __metadata("design:type", String)
], TenantDto.prototype, "name", void 0);
class UserResponseDto {
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin@rga.co.th' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Admin User' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole, example: 'ADMIN' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: TenantDto }),
    __metadata("design:type", TenantDto)
], UserResponseDto.prototype, "tenant", void 0);
class AuthTokensDto {
}
exports.AuthTokensDto = AuthTokensDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Short-lived access token (default: 15m)'
    }),
    __metadata("design:type", String)
], AuthTokensDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Long-lived refresh token (default: 7d)'
    }),
    __metadata("design:type", String)
], AuthTokensDto.prototype, "refreshToken", void 0);
class AuthResponseDto extends AuthTokensDto {
}
exports.AuthResponseDto = AuthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: UserResponseDto }),
    __metadata("design:type", UserResponseDto)
], AuthResponseDto.prototype, "user", void 0);
class RefreshResponseDto extends AuthTokensDto {
}
exports.RefreshResponseDto = RefreshResponseDto;
//# sourceMappingURL=response.dto.js.map