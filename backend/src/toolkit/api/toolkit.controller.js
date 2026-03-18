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
exports.ToolkitController = void 0;
const common_1 = require("@nestjs/common");
const commands_1 = require("../commands");
const dto_1 = require("./dto");
const toolkit_command_executor_service_1 = require("./toolkit-command-executor.service");
const toolkit_internal_guard_1 = require("./toolkit-internal.guard");
const toolkit_query_service_1 = require("./toolkit-query.service");
const toolkit_validation_pipe_1 = require("./toolkit-validation.pipe");
let ToolkitController = class ToolkitController {
    constructor(queryService, commandExecutor) {
        this.queryService = queryService;
        this.commandExecutor = commandExecutor;
    }
    async getMetrics(query) {
        const data = await this.queryService.getMetrics(query);
        return {
            success: true,
            data,
        };
    }
    async getAlerts(query) {
        const data = await this.queryService.getAlerts(query);
        return {
            success: true,
            data,
        };
    }
    async getAlertHistory(query) {
        const data = await this.queryService.getAlertHistory(query);
        return {
            success: true,
            data,
        };
    }
    async runAlertScenario(dto) {
        const command = (0, commands_1.createAlertScenarioCommand)(dto.tenantId, {
            seedBaseline: dto.seedBaseline,
            injectAnomaly: dto.injectAnomaly,
            days: dto.days,
        });
        const result = await this.commandExecutor.executeCommand(command, {
            tenantId: dto.tenantId,
            dryRun: dto.dryRun,
        });
        return this.mapResultToResponse(result);
    }
    async resetTenant(dto) {
        const command = (0, commands_1.createResetTenantCommand)(dto.tenantId);
        const result = await this.commandExecutor.executeCommand(command, {
            tenantId: dto.tenantId,
            dryRun: dto.dryRun,
        });
        return this.mapResultToResponse(result);
    }
    async generateResetTenantHardToken(dto) {
        const issued = this.commandExecutor.issueHardResetToken(dto.tenantId);
        return {
            success: true,
            data: {
                token: issued.token,
                expiresAt: issued.expiresAt.toISOString(),
            },
        };
    }
    async resetTenantHard(dto) {
        const command = (0, commands_1.createResetTenantHardCommand)(dto.tenantId, {
            mode: 'HARD',
            confirmedAt: new Date(dto.confirmedAt),
            confirmationToken: dto.confirmationToken,
        });
        const result = await this.commandExecutor.executeCommand(command, {
            tenantId: dto.tenantId,
            dryRun: dto.dryRun,
        });
        return this.mapResultToResponse(result);
    }
    mapResultToResponse(result) {
        if (result.kind === 'success') {
            return { success: true, data: result.value };
        }
        const error = result.error;
        if (error.code === 'VALIDATION_ERROR') {
            throw new common_1.BadRequestException(error.message);
        }
        if (error.code === 'SAFETY_BLOCK') {
            throw new common_1.ForbiddenException(error.message);
        }
        if (error.code === 'CONCURRENCY_LIMIT') {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (error.isRecoverable) {
            throw new common_1.UnprocessableEntityException({ code: error.code, message: error.message });
        }
        throw new common_1.InternalServerErrorException(error.message);
    }
};
exports.ToolkitController = ToolkitController;
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GetMetricsQueryDto]),
    __metadata("design:returntype", Promise)
], ToolkitController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GetAlertsQueryDto]),
    __metadata("design:returntype", Promise)
], ToolkitController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('alerts/history'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GetAlertHistoryQueryDto]),
    __metadata("design:returntype", Promise)
], ToolkitController.prototype, "getAlertHistory", null);
__decorate([
    (0, common_1.Post)('alert-scenario'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AlertScenarioDto]),
    __metadata("design:returntype", Promise)
], ToolkitController.prototype, "runAlertScenario", null);
__decorate([
    (0, common_1.Post)('reset-tenant'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ResetTenantDto]),
    __metadata("design:returntype", Promise)
], ToolkitController.prototype, "resetTenant", null);
__decorate([
    (0, common_1.Post)('reset-tenant/hard/token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ResetTenantHardTokenDto]),
    __metadata("design:returntype", Promise)
], ToolkitController.prototype, "generateResetTenantHardToken", null);
__decorate([
    (0, common_1.Post)('reset-tenant/hard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ResetTenantHardDto]),
    __metadata("design:returntype", Promise)
], ToolkitController.prototype, "resetTenantHard", null);
exports.ToolkitController = ToolkitController = __decorate([
    (0, common_1.Controller)('internal'),
    (0, common_1.UseGuards)(toolkit_internal_guard_1.ToolkitInternalGuard),
    (0, common_1.UsePipes)((0, toolkit_validation_pipe_1.createToolkitValidationPipe)()),
    __metadata("design:paramtypes", [toolkit_query_service_1.ToolkitQueryService,
        toolkit_command_executor_service_1.ToolkitCommandExecutorService])
], ToolkitController);
//# sourceMappingURL=toolkit.controller.js.map