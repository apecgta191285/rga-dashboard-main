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
exports.AlertController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const alert_service_1 = require("./alert.service");
let AlertController = class AlertController {
    constructor(alertService) {
        this.alertService = alertService;
    }
    async getRules(req) {
        return this.alertService.getRules(req.user.tenantId);
    }
    async initializePresetRules(req) {
        return this.alertService.initializePresetRules(req.user.tenantId);
    }
    async createRule(req, body) {
        const data = {
            name: body.name,
            metric: body.metric,
            operator: body.operator,
            threshold: body.threshold,
            severity: body.severity ? body.severity : undefined,
            description: body.description,
        };
        return this.alertService.createRule(req.user.tenantId, data);
    }
    async updateRule(req, id, body) {
        return this.alertService.updateRule(id, req.user.tenantId, body);
    }
    async toggleRule(req, id) {
        return this.alertService.toggleRule(id, req.user.tenantId);
    }
    async deleteRule(req, id) {
        return this.alertService.deleteRule(id, req.user.tenantId);
    }
    async getAlerts(req, status, severity, limit) {
        return this.alertService.getAlerts(req.user.tenantId, {
            status: status ? status : undefined,
            severity: severity ? severity : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }
    async getOpenAlertsCount(req) {
        return this.alertService.getOpenAlertsCount(req.user.tenantId);
    }
    async checkAlerts(req) {
        return this.alertService.checkAlerts(req.user.tenantId);
    }
    async acknowledgeAlert(req, id) {
        return this.alertService.acknowledgeAlert(id, req.user.tenantId);
    }
    async resolveAlert(req, id) {
        return this.alertService.resolveAlert(id, req.user.tenantId);
    }
    async resolveAllAlerts(req) {
        return this.alertService.resolveAllAlerts(req.user.tenantId);
    }
};
exports.AlertController = AlertController;
__decorate([
    (0, common_1.Get)('rules'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "getRules", null);
__decorate([
    (0, common_1.Post)('rules/init'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "initializePresetRules", null);
__decorate([
    (0, common_1.Post)('rules'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "createRule", null);
__decorate([
    (0, common_1.Put)('rules/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "updateRule", null);
__decorate([
    (0, common_1.Put)('rules/:id/toggle'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "toggleRule", null);
__decorate([
    (0, common_1.Delete)('rules/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "deleteRule", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('severity')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('count'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "getOpenAlertsCount", null);
__decorate([
    (0, common_1.Post)('check'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "checkAlerts", null);
__decorate([
    (0, common_1.Put)(':id/acknowledge'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "acknowledgeAlert", null);
__decorate([
    (0, common_1.Put)(':id/resolve'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "resolveAlert", null);
__decorate([
    (0, common_1.Post)('resolve-all'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "resolveAllAlerts", null);
exports.AlertController = AlertController = __decorate([
    (0, common_1.Controller)('alerts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [alert_service_1.AlertService])
], AlertController);
//# sourceMappingURL=alert.controller.js.map