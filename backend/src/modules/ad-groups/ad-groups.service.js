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
exports.AdGroupsService = void 0;
const common_1 = require("@nestjs/common");
const ad_groups_repository_1 = require("./ad-groups.repository");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let AdGroupsService = class AdGroupsService {
    constructor(repository, auditLogsService) {
        this.repository = repository;
        this.auditLogsService = auditLogsService;
    }
    async create(tenantId, dto) {
        const campaignValid = await this.repository.verifyCampaignOwnership(tenantId, dto.campaignId);
        if (!campaignValid) {
            throw new common_1.ForbiddenException('Campaign not found or does not belong to your organization');
        }
        const createData = {
            name: dto.name,
            status: dto.status || 'ACTIVE',
            campaign: { connect: { id: dto.campaignId } },
            tenant: { connect: { id: tenantId } },
        };
        if (dto.budget !== undefined) {
            createData.budget = dto.budget;
        }
        if (dto.bidAmount !== undefined) {
            createData.bidAmount = dto.bidAmount;
        }
        if (dto.bidType) {
            createData.bidType = dto.bidType;
        }
        if (dto.targeting) {
            createData.targeting = dto.targeting;
        }
        if (dto.externalId) {
            createData.externalId = dto.externalId;
        }
        const adGroup = await this.repository.create(tenantId, createData);
        await this.auditLogsService.createLog({
            action: 'CREATE_AD_GROUP',
            resource: 'AdGroup',
            details: {
                adGroupId: adGroup.id,
                name: adGroup.name,
                campaignId: dto.campaignId,
            },
        });
        return this.normalizeAdGroup(adGroup);
    }
    async findAll(tenantId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const [items, total] = await this.repository.findAll(tenantId, query);
        const normalized = items.map((adGroup) => this.normalizeAdGroup(adGroup));
        return {
            data: normalized,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }
    async findOne(tenantId, id) {
        const adGroup = await this.repository.findOne(tenantId, id);
        if (!adGroup) {
            throw new common_1.NotFoundException('Ad Group not found');
        }
        return this.normalizeAdGroup(adGroup);
    }
    async update(tenantId, id, dto) {
        await this.findOne(tenantId, id);
        const updateData = {};
        if (dto.name !== undefined) {
            updateData.name = dto.name;
        }
        if (dto.status !== undefined) {
            updateData.status = dto.status;
        }
        if (dto.budget !== undefined) {
            updateData.budget = dto.budget;
        }
        if (dto.bidAmount !== undefined) {
            updateData.bidAmount = dto.bidAmount;
        }
        if (dto.bidType !== undefined) {
            updateData.bidType = dto.bidType;
        }
        if (dto.targeting !== undefined) {
            updateData.targeting = dto.targeting;
        }
        if (dto.externalId !== undefined) {
            updateData.externalId = dto.externalId;
        }
        const adGroup = await this.repository.update(tenantId, id, updateData);
        await this.auditLogsService.createLog({
            action: 'UPDATE_AD_GROUP',
            resource: 'AdGroup',
            details: {
                adGroupId: id,
                changes: dto,
            },
        });
        return this.normalizeAdGroup(adGroup);
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        await this.repository.remove(tenantId, id);
        await this.auditLogsService.createLog({
            action: 'DELETE_AD_GROUP',
            resource: 'AdGroup',
            details: { adGroupId: id },
        });
        return { message: 'Ad Group deleted successfully' };
    }
    async findByCampaignId(tenantId, campaignId) {
        const campaignValid = await this.repository.verifyCampaignOwnership(tenantId, campaignId);
        if (!campaignValid) {
            throw new common_1.ForbiddenException('Campaign not found or does not belong to your organization');
        }
        const adGroups = await this.repository.findByCampaignId(tenantId, campaignId);
        return adGroups.map((adGroup) => this.normalizeAdGroup(adGroup));
    }
    normalizeAdGroup(adGroup) {
        return {
            ...adGroup,
            budget: adGroup.budget ? Number(adGroup.budget) : null,
            bidAmount: adGroup.bidAmount ? Number(adGroup.bidAmount) : null,
        };
    }
};
exports.AdGroupsService = AdGroupsService;
exports.AdGroupsService = AdGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ad_groups_repository_1.AdGroupsRepository,
        audit_logs_service_1.AuditLogsService])
], AdGroupsService);
//# sourceMappingURL=ad-groups.service.js.map