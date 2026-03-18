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
exports.AdGroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const ad_groups_service_1 = require("./ad-groups.service");
const dto_1 = require("./dto");
let AdGroupsController = class AdGroupsController {
    constructor(adGroupsService) {
        this.adGroupsService = adGroupsService;
    }
    async create(req, createAdGroupDto) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.create(tenantId, createAdGroupDto);
    }
    async findAll(req, query) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.findAll(tenantId, query);
    }
    async findOne(req, id) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.findOne(tenantId, id);
    }
    async update(req, id, updateAdGroupDto) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.update(tenantId, id, updateAdGroupDto);
    }
    async remove(req, id) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.remove(tenantId, id);
    }
};
exports.AdGroupsController = AdGroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new ad group' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Ad group created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Campaign does not belong to tenant' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateAdGroupDto]),
    __metadata("design:returntype", Promise)
], AdGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all ad groups with filtering and pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'campaignId', required: false, description: 'Filter by campaign ID' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search by name' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.QueryAdGroupsDto]),
    __metadata("design:returntype", Promise)
], AdGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an ad group by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Ad Group ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ad group found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ad group not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an ad group' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Ad Group ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ad group updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ad group not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateAdGroupDto]),
    __metadata("design:returntype", Promise)
], AdGroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an ad group (soft delete)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Ad Group ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ad group deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ad group not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdGroupsController.prototype, "remove", null);
exports.AdGroupsController = AdGroupsController = __decorate([
    (0, swagger_1.ApiTags)('Ad Groups'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('ad-groups'),
    __metadata("design:paramtypes", [ad_groups_service_1.AdGroupsService])
], AdGroupsController);
//# sourceMappingURL=ad-groups.controller.js.map