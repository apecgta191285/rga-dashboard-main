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
exports.PrismaCampaignsRepository = exports.CampaignsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
class CampaignsRepository {
}
exports.CampaignsRepository = CampaignsRepository;
let PrismaCampaignsRepository = class PrismaCampaignsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        return this.prisma.campaign.create({
            data: {
                name: dto.name,
                platform: dto.platform,
                status: dto.status || client_1.CampaignStatus.PENDING,
                budget: dto.budget,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                externalId: dto.externalId || null,
                tenantId,
            },
            include: { metrics: true },
        });
    }
    buildWhereClause(tenantId, query) {
        const search = query.search || undefined;
        let statusFilter;
        if (query.status && query.status !== 'ALL') {
            const statuses = query.status.split(',').filter(s => s !== 'ALL');
            if (statuses.length > 0) {
                statusFilter = statuses.length === 1 ? { equals: statuses[0] } : { in: statuses };
            }
        }
        let platformFilter;
        if (query.platform) {
            console.log('DEBUG: buildWhereClause platform input:', query.platform);
            console.log('DEBUG: AdPlatform Enum Keys/Values:', JSON.stringify(client_1.AdPlatform));
        }
        if (query.platform && query.platform !== 'ALL') {
            const platforms = query.platform.split(',').filter(p => p !== 'ALL').map(p => {
                const key = p.trim().toUpperCase().replace('-', '_');
                if (key === 'GOOGLE')
                    return client_1.AdPlatform.GOOGLE_ADS;
                if (key === 'LINE')
                    return client_1.AdPlatform.LINE_ADS;
                if (key in client_1.AdPlatform) {
                    return client_1.AdPlatform[key];
                }
                return key;
            });
            if (platforms.length > 0) {
                platformFilter = platforms.length === 1 ? { equals: platforms[0] } : { in: platforms };
            }
        }
        const ids = query.ids ? query.ids.split(',').filter(id => id.trim().length > 0) : undefined;
        const where = { tenantId };
        if (ids && ids.length > 0) {
            where.id = { in: ids };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { externalId: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (statusFilter) {
            where.status = statusFilter;
        }
        if (platformFilter) {
            where.platform = platformFilter;
        }
        return where;
    }
    async findAll(tenantId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        const endDate = query.endDate ? new Date(query.endDate) : undefined;
        const where = this.buildWhereClause(tenantId, query);
        const take = limit;
        const skip = (page - 1) * take;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';
        const orderBy = {};
        orderBy[sortBy] = sortOrder;
        let metricsInclude = true;
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate)
                dateFilter.gte = startDate;
            if (endDate)
                dateFilter.lte = endDate;
            metricsInclude = {
                where: { date: dateFilter }
            };
        }
        console.log('DEBUG: findAll execution');
        console.log('DEBUG: where clause:', JSON.stringify(where, null, 2));
        console.log('DEBUG: metricsInclude:', JSON.stringify(metricsInclude, null, 2));
        return Promise.all([
            this.prisma.campaign.findMany({
                where,
                take,
                skip,
                include: { metrics: metricsInclude },
                orderBy,
            }),
            this.prisma.campaign.count({ where }),
        ]);
    }
    async findOne(tenantId, id) {
        return this.prisma.campaign.findFirst({
            where: { id, tenantId },
            include: { metrics: true },
        });
    }
    async update(tenantId, id, data) {
        await this.prisma.campaign.updateMany({
            where: { id, tenantId },
            data,
        });
        return this.prisma.campaign.findFirstOrThrow({
            where: { id, tenantId },
            include: { metrics: true },
        });
    }
    async remove(tenantId, id) {
        await this.prisma.campaign.deleteMany({
            where: { id, tenantId },
        });
    }
    async getMetrics(campaignId, startDate, endDate) {
        const where = { campaignId };
        if (startDate || endDate) {
            where.date = {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
            };
        }
        return this.prisma.metric.findMany({
            where,
            orderBy: { date: 'desc' },
        });
    }
    async getSummary(tenantId, query) {
        const where = this.buildWhereClause(tenantId, query);
        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        const endDate = query.endDate ? new Date(query.endDate) : undefined;
        const campaigns = await this.prisma.campaign.findMany({
            where,
            select: { id: true },
        });
        const campaignIds = campaigns.map((c) => c.id);
        if (campaignIds.length === 0) {
            return {
                _sum: {
                    spend: 0,
                    impressions: 0,
                    clicks: 0,
                    revenue: 0,
                    conversions: 0,
                    budget: 0,
                }
            };
        }
        const metricWhere = {
            campaignId: { in: campaignIds },
            ...(startDate || endDate ? {
                date: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate }),
                },
            } : {}),
        };
        const [metricsAgg, budgetAgg] = await Promise.all([
            this.prisma.metric.aggregate({
                where: metricWhere,
                _sum: {
                    spend: true,
                    impressions: true,
                    clicks: true,
                    revenue: true,
                    conversions: true,
                },
            }),
            this.prisma.campaign.aggregate({
                where,
                _sum: {
                    budget: true,
                },
            }),
        ]);
        return {
            _sum: {
                ...metricsAgg._sum,
                budget: budgetAgg._sum.budget,
            },
        };
    }
};
exports.PrismaCampaignsRepository = PrismaCampaignsRepository;
exports.PrismaCampaignsRepository = PrismaCampaignsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaCampaignsRepository);
//# sourceMappingURL=campaigns.repository.js.map