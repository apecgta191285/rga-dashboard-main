"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertRuleEvaluator = void 0;
const common_1 = require("@nestjs/common");
let AlertRuleEvaluator = class AlertRuleEvaluator {
    evaluate(metrics, rules) {
        const checks = [];
        for (const rule of rules) {
            try {
                const triggered = rule.logic(metrics);
                if (triggered) {
                    checks.push({
                        ruleId: rule.ruleId,
                        name: rule.name,
                        status: rule.severity === 'FAIL' ? 'FAIL' : 'WARN',
                        severity: rule.severity,
                        message: rule.message(metrics),
                        details: { ...metrics }
                    });
                }
                else {
                    checks.push({
                        ruleId: rule.ruleId,
                        name: rule.name,
                        status: 'PASS',
                        severity: rule.severity,
                        message: `Rule ${rule.name} not triggered`,
                        details: { ...metrics }
                    });
                }
            }
            catch (e) {
                checks.push({
                    ruleId: rule.ruleId,
                    name: rule.name,
                    status: 'FAIL',
                    severity: 'FAIL',
                    message: `Evaluation Error: ${e.message}`
                });
            }
        }
        return checks;
    }
};
exports.AlertRuleEvaluator = AlertRuleEvaluator;
exports.AlertRuleEvaluator = AlertRuleEvaluator = __decorate([
    (0, common_1.Injectable)()
], AlertRuleEvaluator);
//# sourceMappingURL=alert-rule.evaluator.js.map