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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const campaigns_service_1 = require("./campaigns.service");
const dto_1 = require("./dto");
let CampaignsController = class CampaignsController {
    constructor(campaignsService) {
        this.campaignsService = campaignsService;
    }
    async create(req, createCampaignDto) {
        const tenantId = req.user.tenantId;
        return this.campaignsService.create(tenantId, createCampaignDto);
    }
    async findAll(req, query) {
        const tenantId = req.user.tenantId;
        return this.campaignsService.findAll(tenantId, query);
    }
    async findOne(req, id) {
        const tenantId = req.user.tenantId;
        return this.campaignsService.findOne(tenantId, id);
    }
    async update(req, id, updateCampaignDto) {
        const tenantId = req.user.tenantId;
        return this.campaignsService.update(tenantId, id, updateCampaignDto);
    }
    async remove(req, id) {
        const tenantId = req.user.tenantId;
        return this.campaignsService.remove(tenantId, id);
    }
    async getMetrics(req, id, startDate, endDate) {
        const tenantId = req.user.tenantId;
        return this.campaignsService.getCampaignMetrics(tenantId, id, startDate || undefined, endDate || undefined);
    }
};
exports.CampaignsController = CampaignsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new campaign' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateCampaignDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all campaigns with filtering, pagination, and time-window metrics',
        description: 'Use startDate/endDate to filter metrics aggregation to a specific time window (e.g., "Last 7 Days").'
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Search by campaign name or external ID' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false, type: String, description: 'Filter by platform' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, type: String, description: 'Sort field' }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort direction' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, description: 'Metrics start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, description: 'Metrics end date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.QueryCampaignsDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a campaign by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateCampaignDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete (soft delete) a campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/metrics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get campaign metrics with optional date range',
        description: 'Returns daily metrics for a single campaign. Use startDate/endDate to filter.'
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getMetrics", null);
exports.CampaignsController = CampaignsController = __decorate([
    (0, swagger_1.ApiTags)('Campaigns'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('campaigns'),
    __metadata("design:paramtypes", [campaigns_service_1.CampaignsService])
], CampaignsController);
//# sourceMappingURL=campaigns.controller.js.map