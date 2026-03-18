"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const alert_rule_evaluator_1 = require("../../../modules/verification/rules/alert-rule.evaluator");
const rule_catalog_1 = require("../../../modules/verification/rules/rule-catalog");
(0, node_test_1.describe)('AlertRuleEvaluator (T4)', () => {
    const evaluator = new alert_rule_evaluator_1.AlertRuleEvaluator();
    (0, node_test_1.test)('should flag LOW_ROAS (BIZ-001)', () => {
        const metrics = { spend: 100, revenue: 80, conversions: 5 };
        const checks = evaluator.evaluate(metrics, rule_catalog_1.BIZ_RULES);
        const rule = checks.find(c => c.ruleId === 'BIZ-001');
        assert.ok(rule, 'BIZ-001 should be evaluated');
        assert.strictEqual(rule.status, 'WARN', 'Should WARN for ROAS < 1.0');
    });
    (0, node_test_1.test)('should flag CRITICAL_ROAS (BIZ-002)', () => {
        const metrics = { spend: 100, revenue: 40, conversions: 5 };
        const checks = evaluator.evaluate(metrics, rule_catalog_1.BIZ_RULES);
        const rule = checks.find(c => c.ruleId === 'BIZ-002');
        assert.ok(rule, 'BIZ-002 should be evaluated');
        assert.strictEqual(rule.status, 'WARN');
    });
    (0, node_test_1.test)('should PASS good ROAS', () => {
        const metrics = { spend: 100, revenue: 200, conversions: 5 };
        const checks = evaluator.evaluate(metrics, rule_catalog_1.BIZ_RULES);
        const rule = checks.find(c => c.ruleId === 'BIZ-001');
        assert.strictEqual(rule?.status, 'PASS');
    });
    (0, node_test_1.test)('should flag NO_CONVERSIONS (BIZ-004)', () => {
        const metrics = { spend: 100, revenue: 0, conversions: 0 };
        const checks = evaluator.evaluate(metrics, rule_catalog_1.BIZ_RULES);
        const rule = checks.find(c => c.ruleId === 'BIZ-004');
        assert.strictEqual(rule?.status, 'WARN');
    });
    (0, node_test_1.test)('should flag ANOMALY (SANE-001)', () => {
        const metrics = { impressions: 10, clicks: 20, spend: 100 };
        const checks = evaluator.evaluate(metrics, rule_catalog_1.ANOMALY_RULES);
        const rule = checks.find(c => c.ruleId === 'SANE-001');
        assert.strictEqual(rule?.status, 'FAIL');
    });
});
//# sourceMappingURL=alert-evaluator.test.js.map