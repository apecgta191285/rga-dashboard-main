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
exports.EcommerceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../modules/auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const ecommerce_service_1 = require("./ecommerce.service");
const ecommerce_rollup_service_1 = require("./ecommerce-rollup.service");
const ecommerce_summary_dto_1 = require("./dto/ecommerce-summary.dto");
const client_1 = require("@prisma/client");
let EcommerceController = class EcommerceController {
    constructor(ecommerceService, ecommerceRollupService) {
        this.ecommerceService = ecommerceService;
        this.ecommerceRollupService = ecommerceRollupService;
    }
    async backfill(tenantId, days) {
        const safeDays = days ? Number(days) : 30;
        if (tenantId) {
            await this.ecommerceRollupService.backfillLastNDaysForTenant(tenantId, safeDays);
        }
        else {
            await this.ecommerceRollupService.backfillLastNDaysForAllTenants(safeDays);
        }
        return { success: true, days: safeDays };
    }
    async getSummary(user, query) {
        const tenantId = query.tenantId && user.role === client_1.UserRole.SUPER_ADMIN ? query.tenantId : user.tenantId;
        return this.ecommerceService.getSummary(tenantId, query);
    }
    async getSalesTrends(user, days, tenantIdQuery) {
        const tenantId = tenantIdQuery && user.role === client_1.UserRole.SUPER_ADMIN ? tenantIdQuery : user.tenantId;
        return this.ecommerceService.getSalesTrends(tenantId, days ? Number(days) : 30);
    }
};
exports.EcommerceController = EcommerceController;
__decorate([
    (0, common_1.Post)('backfill'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Backfill ecommerce data (SUPER_ADMIN only)' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], EcommerceController.prototype, "backfill", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ecommerce summary metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: ecommerce_summary_dto_1.EcommerceSummaryResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ecommerce_summary_dto_1.GetEcommerceSummaryDto]),
    __metadata("design:returntype", Promise)
], EcommerceController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ecommerce sales trends' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String]),
    __metadata("design:returntype", Promise)
], EcommerceController.prototype, "getSalesTrends", null);
exports.EcommerceController = EcommerceController = __decorate([
    (0, swagger_1.ApiTags)('Ecommerce'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('ecommerce'),
    __metadata("design:paramtypes", [ecommerce_service_1.EcommerceService,
        ecommerce_rollup_service_1.EcommerceRollupService])
], EcommerceController);
//# sourceMappingURL=ecommerce.controller.js.map