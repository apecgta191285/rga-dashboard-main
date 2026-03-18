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
var AlertSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const alert_service_1 = require("./alert.service");
let AlertSchedulerService = AlertSchedulerService_1 = class AlertSchedulerService {
    constructor(prisma, alertService) {
        this.prisma = prisma;
        this.alertService = alertService;
        this.logger = new common_1.Logger(AlertSchedulerService_1.name);
    }
    async runScheduledAlertCheck() {
        this.logger.log('🔔 Starting scheduled alert check...');
        try {
            const tenants = await this.prisma.tenant.findMany({
                where: {
                    subscriptionStatus: 'ACTIVE',
                },
                select: {
                    id: true,
                    name: true,
                },
            });
            this.logger.log(`Checking alerts for ${tenants.length} tenants...`);
            let totalAlerts = 0;
            let tenantsWithAlerts = 0;
            for (const tenant of tenants) {
                try {
                    const alerts = await this.alertService.checkAlerts(tenant.id);
                    if (alerts.length > 0) {
                        totalAlerts += alerts.length;
                        tenantsWithAlerts++;
                        this.logger.log(`Created ${alerts.length} alerts for tenant "${tenant.name}" (${tenant.id})`);
                    }
                }
                catch (error) {
                    this.logger.error(`Alert check failed for tenant ${tenant.id}`, error instanceof Error ? error.stack : error);
                }
            }
            this.logger.log(`✅ Scheduled alert check completed: ` +
                `${totalAlerts} alerts created for ${tenantsWithAlerts}/${tenants.length} tenants`);
        }
        catch (error) {
            this.logger.error('Failed to run scheduled alert check', error instanceof Error ? error.stack : error);
        }
    }
    async triggerAlertCheck(tenantId) {
        this.logger.log(`Manual alert check triggered for tenant ${tenantId}`);
        return this.alertService.checkAlerts(tenantId);
    }
    async triggerAlertCheckForAllTenants() {
        this.logger.log('Manual alert check triggered for ALL tenants');
        await this.runScheduledAlertCheck();
        return { message: 'Alert check completed for all tenants' };
    }
};
exports.AlertSchedulerService = AlertSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlertSchedulerService.prototype, "runScheduledAlertCheck", null);
exports.AlertSchedulerService = AlertSchedulerService = AlertSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        alert_service_1.AlertService])
], AlertSchedulerService);
//# sourceMappingURL=alert-scheduler.service.js.map