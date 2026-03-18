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
exports.AdGroupsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdGroupsRepository = class AdGroupsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, data) {
        return this.prisma.adGroup.create({
            data: {
                ...data,
                tenant: { connect: { id: tenantId } },
            },
        });
    }
    async findAll(tenantId, query) {
        const { page = 1, limit = 10, search, status, campaignId, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
        };
        if (campaignId) {
            where.campaignId = campaignId;
        }
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (status) {
            where.status = status.toUpperCase();
        }
        const orderBy = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'asc';
        }
        else {
            orderBy.createdAt = 'desc';
        }
        const [items, total] = await Promise.all([
            this.prisma.adGroup.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    campaign: {
                        select: {
                            id: true,
                            name: true,
                            platform: true,
                        },
                    },
                },
            }),
            this.prisma.adGroup.count({ where }),
        ]);
        return [items, total];
    }
    async findOne(tenantId, id) {
        return this.prisma.adGroup.findFirst({
            where: { id, tenantId },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        platform: true,
                        status: true,
                    },
                },
            },
        });
    }
    async findByCampaignId(tenantId, campaignId) {
        return this.prisma.adGroup.findMany({
            where: { tenantId, campaignId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async update(tenantId, id, data) {
        return this.prisma.adGroup.update({
            where: { id },
            data,
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        platform: true,
                    },
                },
            },
        });
    }
    async remove(tenantId, id) {
        await this.prisma.adGroup.update({
            where: { id },
            data: { status: 'DELETED' },
        });
    }
    async hardDelete(tenantId, id) {
        await this.prisma.adGroup.delete({
            where: { id },
        });
    }
    async verifyCampaignOwnership(tenantId, campaignId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, tenantId },
            select: { id: true },
        });
        return !!campaign;
    }
};
exports.AdGroupsRepository = AdGroupsRepository;
exports.AdGroupsRepository = AdGroupsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdGroupsRepository);
//# sourceMappingURL=ad-groups.repository.js.map