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
var DebugService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DebugService = DebugService_1 = class DebugService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DebugService_1.name);
    }
    async clearMockData() {
        this.logger.log('Clearing all mock data...');
        const metricsResult = await this.prisma.metric.deleteMany({
            where: { isMockData: true },
        });
        const ga4Result = await this.prisma.webAnalyticsDaily.deleteMany({
            where: { isMockData: true },
        });
        this.logger.log(`Cleared ${metricsResult.count} mock metrics and ${ga4Result.count} mock GA4 records`);
        return {
            success: true,
            deletedMetrics: metricsResult.count,
            deletedGA4Records: ga4Result.count,
        };
    }
};
exports.DebugService = DebugService;
exports.DebugService = DebugService = DebugService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DebugService);
//# sourceMappingURL=debug.service.js.map