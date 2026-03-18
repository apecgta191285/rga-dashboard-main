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
var DevController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const mock_data_seeder_service_1 = require("./mock-data-seeder.service");
let DevController = DevController_1 = class DevController {
    constructor(mockSeeder) {
        this.mockSeeder = mockSeeder;
        this.logger = new common_1.Logger(DevController_1.name);
    }
    ensureNotProduction() {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.ForbiddenException('Development tools are disabled in production environment');
        }
    }
    async seedAll(user) {
        this.ensureNotProduction();
        this.logger.log(`[DEV] ${user.email} → seed-all`);
        return this.mockSeeder.seedAll(user.tenantId);
    }
    async seedCampaigns(user) {
        this.ensureNotProduction();
        this.logger.log(`[DEV] ${user.email} → seed-campaigns`);
        return this.mockSeeder.seedCampaigns(user.tenantId);
    }
    async seedMetrics(user, days) {
        this.ensureNotProduction();
        this.logger.log(`[DEV] ${user.email} → seed-metrics (${days || 30} days)`);
        return this.mockSeeder.seedAllCampaignMetrics(user.tenantId, days || 30);
    }
    async seedAlerts(user) {
        this.ensureNotProduction();
        this.logger.log(`[DEV] ${user.email} → seed-alerts`);
        return this.mockSeeder.seedAlerts(user.tenantId, 8);
    }
    async seedSyncLogs(user) {
        this.ensureNotProduction();
        this.logger.log(`[DEV] ${user.email} → seed-sync-logs`);
        return this.mockSeeder.seedSyncLogs(user.tenantId, 12);
    }
    async seedByPlatform(user, platform) {
        this.ensureNotProduction();
        this.logger.log(`[DEV] ${user.email} → seed-platform/${platform}`);
        return this.mockSeeder.seedCampaigns(user.tenantId, [platform]);
    }
    async clearMockData(user) {
        this.ensureNotProduction();
        this.logger.log(`[DEV] ${user.email} → clear-mock`);
        return this.mockSeeder.clearMockData(user.tenantId);
    }
    async clearCampaigns(user) {
        this.ensureNotProduction();
        this.logger.log(`[DEV] ${user.email} → clear-campaigns`);
        return this.mockSeeder.clearCampaignsAndMetrics(user.tenantId);
    }
};
exports.DevController = DevController;
__decorate([
    (0, common_1.Post)('seed-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed ทั้งหมด (campaigns, metrics, alerts, sync logs)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "seedAll", null);
__decorate([
    (0, common_1.Post)('seed-campaigns'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed campaigns (12 campaigns ทุก platform)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "seedCampaigns", null);
__decorate([
    (0, common_1.Post)('seed-metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed metrics สำหรับ campaigns ทั้งหมด (30 วัน)' }),
    (0, swagger_1.ApiBody)({ schema: { properties: { days: { type: 'number', default: 30 } } }, required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "seedMetrics", null);
__decorate([
    (0, common_1.Post)('seed-alerts'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed alerts (8 alerts)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "seedAlerts", null);
__decorate([
    (0, common_1.Post)('seed-sync-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed sync logs (12 logs)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "seedSyncLogs", null);
__decorate([
    (0, common_1.Post)('seed-platform/:platform'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed campaigns สำหรับ platform เฉพาะ' }),
    (0, swagger_1.ApiParam)({ name: 'platform', enum: ['GOOGLE_ADS', 'FACEBOOK', 'TIKTOK', 'LINE_ADS'] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "seedByPlatform", null);
__decorate([
    (0, common_1.Delete)('clear-mock'),
    (0, swagger_1.ApiOperation)({ summary: 'ลบ mock data ทั้งหมด' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "clearMockData", null);
__decorate([
    (0, common_1.Delete)('clear-campaigns'),
    (0, swagger_1.ApiOperation)({ summary: 'ลบเฉพาะ mock campaigns และ metrics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "clearCampaigns", null);
exports.DevController = DevController = DevController_1 = __decorate([
    (0, swagger_1.ApiTags)('Dev Tools'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('dev'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [mock_data_seeder_service_1.MockDataSeederService])
], DevController);
//# sourceMappingURL=dev.controller.js.map