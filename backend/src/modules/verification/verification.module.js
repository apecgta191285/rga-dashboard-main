"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const verification_service_1 = require("./verification.service");
const verification_repository_1 = require("./verification.repository");
const scenario_loader_1 = require("../../toolkit/scenarios/scenario-loader");
const alert_rule_evaluator_1 = require("./rules/alert-rule.evaluator");
let VerificationModule = class VerificationModule {
};
exports.VerificationModule = VerificationModule;
exports.VerificationModule = VerificationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [
            verification_service_1.VerificationService,
            verification_repository_1.VerificationRepository,
            scenario_loader_1.ScenarioLoader,
            alert_rule_evaluator_1.AlertRuleEvaluator,
        ],
        exports: [verification_service_1.VerificationService],
    })
], VerificationModule);
//# sourceMappingURL=verification.module.js.map