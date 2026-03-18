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
exports.TikTokAdsIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
const swagger_1 = require("@nestjs/swagger");
let TikTokAdsIntegrationController = class TikTokAdsIntegrationController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStatus(req) {
        const tenantId = req.user.tenantId;
        const accounts = await this.prisma.tikTokAdsAccount.findMany({
            where: { tenantId },
            select: {
                id: true,
                advertiserId: true,
                accountName: true,
                status: true,
                lastSyncAt: true,
                createdAt: true,
            },
        });
        const mappedAccounts = accounts.map(account => ({
            id: account.id,
            externalId: account.advertiserId,
            name: account.accountName || 'Unnamed Account',
            status: account.status,
        }));
        const lastSyncAt = accounts.length > 0
            ? accounts
                .map(a => a.lastSyncAt)
                .filter(Boolean)
                .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || null
            : null;
        return {
            isConnected: accounts.length > 0,
            lastSyncAt,
            accounts: mappedAccounts,
        };
    }
    async disconnect(req) {
        const tenantId = req.user.tenantId;
        await this.prisma.tikTokAdsAccount.deleteMany({
            where: { tenantId },
        });
        return {
            success: true,
            message: 'TikTok Ads disconnected successfully',
        };
    }
};
exports.TikTokAdsIntegrationController = TikTokAdsIntegrationController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check TikTok Ads integration status' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TikTokAdsIntegrationController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect TikTok Ads integration' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TikTokAdsIntegrationController.prototype, "disconnect", null);
exports.TikTokAdsIntegrationController = TikTokAdsIntegrationController = __decorate([
    (0, swagger_1.ApiTags)('TikTok Ads Integration'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('integrations/tiktok-ads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TikTokAdsIntegrationController);
//# sourceMappingURL=tiktok-ads-integration.controller.js.map