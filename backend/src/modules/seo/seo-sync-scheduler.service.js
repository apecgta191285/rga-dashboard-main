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
var SeoSyncSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoSyncSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const seo_service_1 = require("./seo.service");
let SeoSyncSchedulerService = SeoSyncSchedulerService_1 = class SeoSyncSchedulerService {
    constructor(prisma, seoService) {
        this.prisma = prisma;
        this.seoService = seoService;
        this.logger = new common_1.Logger(SeoSyncSchedulerService_1.name);
    }
    async scheduledGscSync() {
        const tenants = await this.prisma.tenant.findMany({
            select: { id: true },
        });
        for (const t of tenants) {
            try {
                await this.seoService.syncGscForTenant(t.id, { days: 30 });
                this.logger.log(`[GSC Sync] Completed for tenant ${t.id}`);
            }
            catch (error) {
                this.logger.error(`[GSC Sync] Failed for tenant ${t.id}: ${error.message}`);
            }
        }
    }
};
exports.SeoSyncSchedulerService = SeoSyncSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeoSyncSchedulerService.prototype, "scheduledGscSync", null);
exports.SeoSyncSchedulerService = SeoSyncSchedulerService = SeoSyncSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        seo_service_1.SeoService])
], SeoSyncSchedulerService);
//# sourceMappingURL=seo-sync-scheduler.service.js.map