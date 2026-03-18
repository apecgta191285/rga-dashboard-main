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
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../modules/auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const crm_service_1 = require("./crm.service");
const crm_summary_dto_1 = require("./dto/crm-summary.dto");
const client_1 = require("@prisma/client");
let CrmController = class CrmController {
    constructor(crmService) {
        this.crmService = crmService;
    }
    async getSummary(user, query) {
        const tenantId = query.tenantId && user.role === client_1.UserRole.SUPER_ADMIN ? query.tenantId : user.tenantId;
        return this.crmService.getSummary(tenantId, query);
    }
    async getPipelineTrends(user, days, tenantIdQuery) {
        const tenantId = tenantIdQuery && user.role === client_1.UserRole.SUPER_ADMIN ? tenantIdQuery : user.tenantId;
        return this.crmService.getPipelineTrends(tenantId, days ? Number(days) : 30);
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get CRM summary metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: crm_summary_dto_1.CrmSummaryResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, crm_summary_dto_1.GetCrmSummaryDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, swagger_1.ApiOperation)({ summary: 'Get CRM pipeline trends' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getPipelineTrends", null);
exports.CrmController = CrmController = __decorate([
    (0, swagger_1.ApiTags)('CRM'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('crm'),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
//# sourceMappingURL=crm.controller.js.map