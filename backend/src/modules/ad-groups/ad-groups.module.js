"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdGroupsModule = void 0;
const common_1 = require("@nestjs/common");
const ad_groups_controller_1 = require("./ad-groups.controller");
const ad_groups_service_1 = require("./ad-groups.service");
const ad_groups_repository_1 = require("./ad-groups.repository");
const prisma_module_1 = require("../prisma/prisma.module");
const audit_logs_module_1 = require("../audit-logs/audit-logs.module");
let AdGroupsModule = class AdGroupsModule {
};
exports.AdGroupsModule = AdGroupsModule;
exports.AdGroupsModule = AdGroupsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_logs_module_1.AuditLogsModule],
        controllers: [ad_groups_controller_1.AdGroupsController],
        providers: [ad_groups_service_1.AdGroupsService, ad_groups_repository_1.AdGroupsRepository],
        exports: [ad_groups_service_1.AdGroupsService],
    })
], AdGroupsModule);
//# sourceMappingURL=ad-groups.module.js.map