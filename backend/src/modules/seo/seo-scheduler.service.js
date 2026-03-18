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
var SeoSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const seo_rollup_service_1 = require("./seo-rollup.service");
let SeoSchedulerService = SeoSchedulerService_1 = class SeoSchedulerService {
    constructor(seoRollupService) {
        this.seoRollupService = seoRollupService;
        this.logger = new common_1.Logger(SeoSchedulerService_1.name);
    }
    async rollupYesterday() {
        this.logger.log('Starting scheduled SEO daily rollup (yesterday)...');
        await this.seoRollupService.upsertYesterdayForAllTenants();
        this.logger.log('Scheduled SEO daily rollup completed');
    }
};
exports.SeoSchedulerService = SeoSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_1AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeoSchedulerService.prototype, "rollupYesterday", null);
exports.SeoSchedulerService = SeoSchedulerService = SeoSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [seo_rollup_service_1.SeoRollupService])
], SeoSchedulerService);
//# sourceMappingURL=seo-scheduler.service.js.map