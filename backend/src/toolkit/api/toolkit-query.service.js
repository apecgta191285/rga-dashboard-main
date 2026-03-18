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
exports.ToolkitQueryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
let ToolkitQueryService = class ToolkitQueryService {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async getMetrics(query) {
        const where = { tenantId: query.tenantId };
        if (query.campaignId) {
            where.campaignId = query.campaignId;
        }
        if (query.startDate || query.endDate) {
            const dateWhere = {};
            if (query.startDate) {
                dateWhere.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                dateWhere.lte = new Date(query.endDate);
            }
            where.date = dateWhere;
        }
        const metrics = await this.prismaService.metric.findMany({
            where,
            orderBy: { date: 'desc' },
            take: query.limit,
        });
        return { metrics, count: metrics.length };
    }
    async getAlerts(query) {
        const where = { tenantId: query.tenantId };
        if (query.status) {
            where.status = query.status;
        }
        const alerts = await this.prismaService.alert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { rule: true, campaign: true },
        });
        return { alerts, count: alerts.length };
    }
    async getAlertHistory(query) {
        const where = { tenantId: query.tenantId };
        const history = await this.prismaService.alertHistory.findMany({
            where,
            orderBy: { triggeredAt: 'desc' },
            take: query.limit,
        });
        return { history, count: history.length };
    }
};
exports.ToolkitQueryService = ToolkitQueryService;
exports.ToolkitQueryService = ToolkitQueryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ToolkitQueryService);
//# sourceMappingURL=toolkit-query.service.js.map