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
exports.IntegrationSwitchService = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("../dashboard/dashboard.service");
let IntegrationSwitchService = class IntegrationSwitchService {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getDashboardOverview(user, query) {
        return this.dashboardService.getOverview(user, query);
    }
    async getTopCampaigns(tenantId, limit = 5, days = 30) {
        return this.dashboardService.getTopCampaigns(tenantId, limit, days);
    }
};
exports.IntegrationSwitchService = IntegrationSwitchService;
exports.IntegrationSwitchService = IntegrationSwitchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], IntegrationSwitchService);
//# sourceMappingURL=integration-switch.service.js.map