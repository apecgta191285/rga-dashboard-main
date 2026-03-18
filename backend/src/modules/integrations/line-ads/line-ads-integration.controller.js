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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineAdsIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
let LineAdsIntegrationController = class LineAdsIntegrationController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStatus(req) {
        const tenantId = req.user.tenantId;
        const accounts = await this.prisma.lineAdsAccount.findMany({
            where: { tenantId },
            select: {
                id: true,
                channelId: true,
                channelName: true,
                status: true,
                lastSyncAt: true,
                createdAt: true,
            },
        });
        return {
            isConnected: accounts.length > 0,
            accounts: accounts,
        };
    }
    async getConnectedAccounts(req) {
        const tenantId = req.user.tenantId;
        const accounts = await this.prisma.lineAdsAccount.findMany({
            where: { tenantId },
            select: {
                id: true,
                channelId: true,
                channelName: true,
                status: true,
                lastSyncAt: true,
                createdAt: true,
            },
        });
        return { accounts };
    }
    async disconnect(req) {
        const tenantId = req.user.tenantId;
        await this.prisma.lineAdsAccount.deleteMany({
            where: { tenantId },
        });
        return {
            success: true,
            message: 'LINE Ads disconnected successfully',
        };
    }
};
exports.LineAdsIntegrationController = LineAdsIntegrationController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check LINE Ads integration status' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LineAdsIntegrationController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('accounts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get connected LINE Ads accounts' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LineAdsIntegrationController.prototype, "getConnectedAccounts", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect LINE Ads integration' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LineAdsIntegrationController.prototype, "disconnect", null);
exports.LineAdsIntegrationController = LineAdsIntegrationController = __decorate([
    (0, swagger_1.ApiTags)('integrations/line-ads'),
    (0, common_1.Controller)('integrations/line-ads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LineAdsIntegrationController);
//# sourceMappingURL=line-ads-integration.controller.js.map