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
var VerificationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const verification_seeder_1 = require("../mock-data/generators/verification-seeder");
const alert_scheduler_service_1 = require("../alerts/alert-scheduler.service");
let VerificationController = VerificationController_1 = class VerificationController {
    constructor(verificationSeeder, alertSchedulerService) {
        this.verificationSeeder = verificationSeeder;
        this.alertSchedulerService = alertSchedulerService;
        this.logger = new common_1.Logger(VerificationController_1.name);
    }
    ensureNotProduction() {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.ForbiddenException('Verification endpoints are disabled in production environment');
        }
    }
    async seedHeavy(tenantId, count) {
        this.ensureNotProduction();
        const requested = typeof count === 'number' && Number.isFinite(count) ? count : 10000;
        this.logger.log(`[VERIFY] seed-heavy → tenantId=${tenantId}, count=${requested}`);
        return this.verificationSeeder.seedHeavyCampaigns(tenantId, requested);
    }
    async triggerAlertNow(email) {
        this.ensureNotProduction();
        this.logger.log(`[VERIFY] trigger-alert-now → ${email}`);
        const anyScheduler = this.alertSchedulerService;
        if (typeof anyScheduler.handleCron === 'function') {
            await anyScheduler.handleCron();
            return { success: true, message: 'Alert cron triggered (handleCron)' };
        }
        if (typeof anyScheduler.runScheduledAlertCheck === 'function') {
            await anyScheduler.runScheduledAlertCheck();
            return { success: true, message: 'Alert cron triggered (runScheduledAlertCheck)' };
        }
        if (typeof anyScheduler.triggerAlertCheckForAllTenants === 'function') {
            return anyScheduler.triggerAlertCheckForAllTenants();
        }
        throw new Error('No runnable alert scheduler method found');
    }
    async memoryCheck() {
        return process.memoryUsage();
    }
};
exports.VerificationController = VerificationController;
__decorate([
    (0, common_1.Post)('seed-heavy'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed heavy campaigns (10,000+ rows) for export/alert verification' }),
    (0, swagger_1.ApiBody)({ schema: { properties: { count: { type: 'number', default: 10000 } } }, required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Body)('count')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "seedHeavy", null);
__decorate([
    (0, common_1.Post)('trigger-alert-now'),
    (0, swagger_1.ApiOperation)({ summary: 'Force immediate alert evaluation (manual cron trigger)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "triggerAlertNow", null);
__decorate([
    (0, common_1.Get)('memory-check'),
    (0, swagger_1.ApiOperation)({ summary: 'Return Node.js process memory usage' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VerificationController.prototype, "memoryCheck", null);
exports.VerificationController = VerificationController = VerificationController_1 = __decorate([
    (0, swagger_1.ApiTags)('Verification'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [verification_seeder_1.VerificationSeeder,
        alert_scheduler_service_1.AlertSchedulerService])
], VerificationController);
//# sourceMappingURL=verification.controller.js.map