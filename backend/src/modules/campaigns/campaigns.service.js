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
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const campaigns_repository_1 = require("./campaigns.repository");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let CampaignsService = class CampaignsService {
    constructor(repository, auditLogsService) {
        this.repository = repository;
        this.auditLogsService = auditLogsService;
    }
    safe(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }
    toDate(s) {
        if (!s)
            return undefined;
        const d = new Date(s);
        return isNaN(d.getTime()) ? undefined : d;
    }
    async create(tenantId, dto) {
        const campaign = await this.repository.create(tenantId, dto);
        await this.auditLogsService.createLog({
            action: 'CREATE_CAMPAIGN',
            resource: 'Campaign',
            details: { campaignId: campaign.id, name: campaign.name, platform: campaign.platform },
        });
        return this.normalizeCampaign(campaign);
    }
    async findAll(tenantId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';
        const dbSortFields = ['name', 'createdAt', 'status', 'platform', 'budget', 'startDate', 'endDate', 'updatedAt'];
        const isDbSort = dbSortFields.includes(sortBy);
        if (isDbSort) {
            const [[items, total], summaryRaw] = await Promise.all([
                this.repository.findAll(tenantId, query),
                this.repository.getSummary(tenantId, query),
            ]);
            const normalized = items.map((c) => this.normalizeCampaign(c));
            const s = summaryRaw._sum;
            const summary = {
                spend: this.safe(s.spend),
                budget: this.safe(s.budget),
                impressions: this.safe(s.impressions),
                clicks: this.safe(s.clicks),
                revenue: this.safe(s.revenue),
                conversions: this.safe(s.conversions),
                roas: this.safe(s.spend) ? Number((this.safe(s.revenue) / this.safe(s.spend)).toFixed(2)) : 0,
                roi: this.safe(s.spend) ? Number(((this.safe(s.revenue) - this.safe(s.spend)) / this.safe(s.spend) * 100).toFixed(2)) : -100,
                ctr: this.safe(s.impressions) ? Number(((this.safe(s.clicks) / this.safe(s.impressions)) * 100).toFixed(2)) : 0,
                cpc: this.safe(s.clicks) ? Number((this.safe(s.spend) / this.safe(s.clicks)).toFixed(2)) : 0,
                cpm: this.safe(s.impressions) ? Number(((this.safe(s.spend) / this.safe(s.impressions)) * 1000).toFixed(2)) : 0,
            };
            return {
                data: normalized,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                    ...(query.startDate && { startDate: query.startDate }),
                    ...(query.endDate && { endDate: query.endDate }),
                },
                summary,
            };
        }
        else {
            const queryForRepo = {
                ...query,
                page: 1,
                limit: 10000,
                sortBy: 'createdAt'
            };
            const [[items, total], summaryRaw] = await Promise.all([
                this.repository.findAll(tenantId, queryForRepo),
                this.repository.getSummary(tenantId, query),
            ]);
            const s = summaryRaw._sum;
            const summary = {
                spend: this.safe(s.spend),
                budget: this.safe(s.budget),
                impressions: this.safe(s.impressions),
                clicks: this.safe(s.clicks),
                revenue: this.safe(s.revenue),
                conversions: this.safe(s.conversions),
                roas: this.safe(s.spend) ? Number((this.safe(s.revenue) / this.safe(s.spend)).toFixed(2)) : 0,
                roi: this.safe(s.spend) ? Number(((this.safe(s.revenue) - this.safe(s.spend)) / this.safe(s.spend) * 100).toFixed(2)) : -100,
                ctr: this.safe(s.impressions) ? Number(((this.safe(s.clicks) / this.safe(s.impressions)) * 100).toFixed(2)) : 0,
                cpc: this.safe(s.clicks) ? Number((this.safe(s.spend) / this.safe(s.clicks)).toFixed(2)) : 0,
                cpm: this.safe(s.impressions) ? Number(((this.safe(s.spend) / this.safe(s.impressions)) * 1000).toFixed(2)) : 0,
            };
            let normalized = items.map((c) => this.normalizeCampaign(c));
            normalized.sort((a, b) => {
                const valA = a[sortBy] ?? 0;
                const valB = b[sortBy] ?? 0;
                if (valA < valB)
                    return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB)
                    return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
            const startIndex = (page - 1) * limit;
            const paginated = normalized.slice(startIndex, startIndex + limit);
            return {
                data: paginated,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                    ...(query.startDate && { startDate: query.startDate }),
                    ...(query.endDate && { endDate: query.endDate }),
                },
                summary,
            };
        }
    }
    async findOne(tenantId, id) {
        const campaign = await this.repository.findOne(tenantId, id);
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        return this.normalizeCampaign(campaign);
    }
    async update(tenantId, id, dto) {
        await this.findOne(tenantId, id);
        const data = {};
        if (dto.name !== undefined) {
            data.name = dto.name;
        }
        if (dto.platform !== undefined) {
            data.platform = dto.platform;
        }
        if (dto.status !== undefined) {
            data.status = dto.status;
        }
        if (dto.budget !== undefined) {
            data.budget = dto.budget;
        }
        if (dto.startDate !== undefined) {
            data.startDate = dto.startDate ? new Date(dto.startDate) : null;
        }
        if (dto.endDate !== undefined) {
            data.endDate = dto.endDate ? new Date(dto.endDate) : null;
        }
        const campaign = await this.repository.update(tenantId, id, data);
        return this.normalizeCampaign(campaign);
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        await this.repository.remove(tenantId, id);
        return { message: 'Campaign deleted successfully' };
    }
    async getCampaignMetrics(tenantId, id, startDate, endDate) {
        const campaign = await this.findOne(tenantId, id);
        const start = this.toDate(startDate);
        const end = this.toDate(endDate);
        const metrics = await this.repository.getMetrics(id, start, end);
        return {
            campaign: {
                id: campaign.id,
                name: campaign.name,
                platform: campaign.platform,
            },
            metrics: metrics.map((m) => {
                const spend = this.safe(m.spend);
                const impressions = m.impressions ?? 0;
                const clicks = m.clicks ?? 0;
                return {
                    date: m.date,
                    impressions,
                    clicks,
                    spend,
                    conversions: m.conversions,
                    revenue: this.safe(m.revenue),
                    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                    cpc: clicks > 0 ? spend / clicks : 0,
                    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
                    roas: this.safe(m.roas),
                };
            }),
        };
    }
    normalizeCampaign(c) {
        const m = c.metrics || [];
        const spend = m.reduce((s, x) => s + this.safe(x.spend), 0);
        const revenue = m.reduce((s, x) => s + this.safe(x.revenue), 0);
        const clicks = m.reduce((s, x) => s + this.safe(x.clicks), 0);
        const impressions = m.reduce((s, x) => s + this.safe(x.impressions), 0);
        const conversions = m.reduce((s, x) => s + this.safe(x.conversions), 0);
        return {
            id: c.id,
            name: c.name,
            platform: c.platform,
            status: c.status,
            budget: this.safe(c.budget),
            startDate: c.startDate,
            endDate: c.endDate,
            externalId: c.externalId,
            spend,
            revenue,
            clicks,
            impressions,
            conversions,
            roas: spend ? Number((revenue / spend).toFixed(2)) : 0,
            roi: spend ? Number(((revenue - spend) / spend * 100).toFixed(2)) : -100,
            ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
            cpc: clicks ? Number((spend / clicks).toFixed(2)) : 0,
            cpm: impressions ? Number(((spend / impressions) * 1000).toFixed(2)) : 0,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        };
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [campaigns_repository_1.CampaignsRepository,
        audit_logs_service_1.AuditLogsService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map