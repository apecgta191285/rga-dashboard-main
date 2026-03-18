"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertEngine = void 0;
const tsyringe_1 = require("tsyringe");
let AlertEngine = class AlertEngine {
    evaluateOnce(snapshot, rules, context) {
        const startTime = Date.now();
        const evaluatedAt = new Date();
        const enabledRules = rules.filter((rule) => rule.enabled);
        const triggeredAlerts = [];
        for (const rule of enabledRules) {
            const result = this.evaluateRule(snapshot, rule, evaluatedAt);
            if (result.triggered) {
                triggeredAlerts.push(result);
            }
        }
        return {
            triggeredAlerts,
            evaluatedAt,
            context,
            metadata: {
                totalRules: rules.length,
                enabledRules: enabledRules.length,
                triggeredCount: triggeredAlerts.length,
                durationMs: Date.now() - startTime,
            },
        };
    }
    evaluateCheck(snapshots, rules, context, baselines) {
        const startTime = Date.now();
        const evaluatedAt = new Date();
        const enabledRules = rules.filter((rule) => rule.enabled);
        const allTriggeredAlerts = [];
        for (const snapshot of snapshots) {
            const baseline = baselines?.get(snapshot.campaignId);
            for (const rule of enabledRules) {
                const result = this.evaluateRuleWithBaseline(snapshot, rule, baseline, evaluatedAt);
                if (result.triggered) {
                    allTriggeredAlerts.push(result);
                }
            }
        }
        return {
            triggeredAlerts: allTriggeredAlerts,
            evaluatedAt,
            context,
            metadata: {
                totalRules: rules.length,
                enabledRules: enabledRules.length,
                triggeredCount: allTriggeredAlerts.length,
                durationMs: Date.now() - startTime,
            },
        };
    }
    evaluateRule(snapshot, rule, evaluatedAt) {
        const condition = rule.condition;
        switch (condition.type) {
            case 'THRESHOLD':
                return this.evaluateThreshold(snapshot, rule, condition, evaluatedAt);
            case 'DROP_PERCENT':
                return this.evaluateDropPercentWithoutBaseline(snapshot, rule, condition, evaluatedAt);
            case 'ZERO_CONVERSIONS':
                return this.evaluateZeroConversions(snapshot, rule, condition, evaluatedAt);
            default:
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    condition,
                    severity: rule.severity,
                    triggered: false,
                    reason: `Unknown condition type: ${condition.type}`,
                    evaluatedAt,
                    values: {},
                };
        }
    }
    evaluateRuleWithBaseline(snapshot, rule, baseline, evaluatedAt) {
        const condition = rule.condition;
        switch (condition.type) {
            case 'THRESHOLD':
                return this.evaluateThreshold(snapshot, rule, condition, evaluatedAt);
            case 'DROP_PERCENT':
                if (baseline) {
                    return this.evaluateDropPercent(snapshot, baseline, rule, condition, evaluatedAt);
                }
                return this.evaluateDropPercentWithoutBaseline(snapshot, rule, condition, evaluatedAt);
            case 'ZERO_CONVERSIONS':
                return this.evaluateZeroConversions(snapshot, rule, condition, evaluatedAt);
            default:
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    condition,
                    severity: rule.severity,
                    triggered: false,
                    reason: `Unknown condition type`,
                    evaluatedAt,
                    values: {},
                };
        }
    }
    evaluateThreshold(snapshot, rule, condition, evaluatedAt) {
        const currentValue = snapshot.metrics[condition.metric];
        if (currentValue === undefined || currentValue === null) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `Metric "${condition.metric}" is missing in snapshot`,
                evaluatedAt,
                values: { current: currentValue },
            };
        }
        let triggered = false;
        const threshold = condition.value;
        switch (condition.operator) {
            case 'GT':
                triggered = currentValue > threshold;
                break;
            case 'LT':
                triggered = currentValue < threshold;
                break;
            case 'GTE':
                triggered = currentValue >= threshold;
                break;
            case 'LTE':
                triggered = currentValue <= threshold;
                break;
            case 'EQ':
                const epsilon = 0.0001;
                triggered = Math.abs(currentValue - threshold) < epsilon;
                break;
            default:
                triggered = false;
        }
        let reason;
        if (triggered) {
            reason = `${condition.metric} (${this.formatNumber(currentValue)}) ${this.operatorToString(condition.operator)} ${this.formatNumber(threshold)}`;
        }
        else {
            reason = `${condition.metric} (${this.formatNumber(currentValue)}) does not satisfy ${this.operatorToString(condition.operator)} ${this.formatNumber(threshold)}`;
        }
        return {
            ruleId: rule.id,
            ruleName: rule.name,
            condition,
            severity: rule.severity,
            triggered,
            reason,
            evaluatedAt,
            values: {
                current: currentValue,
                threshold,
            },
        };
    }
    evaluateDropPercent(snapshot, baseline, rule, condition, evaluatedAt) {
        const currentValue = snapshot.metrics[condition.metric];
        const baselineValue = baseline.metrics[condition.metric];
        if (currentValue === undefined || baselineValue === undefined) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `Metric "${condition.metric}" is missing in current or baseline`,
                evaluatedAt,
                values: { current: currentValue, baseline: baselineValue },
            };
        }
        if (baselineValue <= 0) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `Cannot calculate drop: baseline ${condition.metric} is ${baselineValue} (must be positive)`,
                evaluatedAt,
                values: { current: currentValue, baseline: baselineValue },
            };
        }
        if (currentValue >= baselineValue) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `${condition.metric} increased or stayed same: ${this.formatNumber(currentValue)} vs baseline ${this.formatNumber(baselineValue)}`,
                evaluatedAt,
                values: { current: currentValue, baseline: baselineValue, dropPercent: 0 },
            };
        }
        const dropAmount = baselineValue - currentValue;
        const dropPercent = (dropAmount / baselineValue) * 100;
        const thresholdPercent = condition.thresholdPercent;
        const triggered = dropPercent >= thresholdPercent;
        let reason;
        if (triggered) {
            reason = `${condition.metric} dropped ${this.formatNumber(dropPercent)}% (${this.formatNumber(baselineValue)} → ${this.formatNumber(currentValue)}), exceeds threshold of ${thresholdPercent}%`;
        }
        else {
            reason = `${condition.metric} dropped ${this.formatNumber(dropPercent)}% (${this.formatNumber(baselineValue)} → ${this.formatNumber(currentValue)}), below threshold of ${thresholdPercent}%`;
        }
        return {
            ruleId: rule.id,
            ruleName: rule.name,
            condition,
            severity: rule.severity,
            triggered,
            reason,
            evaluatedAt,
            values: {
                current: currentValue,
                baseline: baselineValue,
                dropPercent,
            },
        };
    }
    evaluateDropPercentWithoutBaseline(snapshot, rule, condition, evaluatedAt) {
        const currentValue = snapshot.metrics[condition.metric];
        return {
            ruleId: rule.id,
            ruleName: rule.name,
            condition,
            severity: rule.severity,
            triggered: false,
            reason: `DROP_PERCENT condition requires baseline data (not provided)`,
            evaluatedAt,
            values: {
                current: currentValue,
            },
        };
    }
    evaluateZeroConversions(snapshot, rule, condition, evaluatedAt) {
        const conversions = snapshot.metrics.conversions;
        const spend = snapshot.metrics.spend;
        const minSpend = condition.minSpend;
        if (conversions === undefined || spend === undefined) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `Missing required metrics (conversions or spend)`,
                evaluatedAt,
                values: { current: conversions },
            };
        }
        const hasZeroConversions = conversions === 0;
        const meetsSpendThreshold = spend >= minSpend;
        const triggered = hasZeroConversions && meetsSpendThreshold;
        let reason;
        if (triggered) {
            reason = `Zero conversions with spend ${this.formatCurrency(spend)} (threshold: ${this.formatCurrency(minSpend)})`;
        }
        else if (!hasZeroConversions) {
            reason = `Has ${conversions} conversions (needs zero)`;
        }
        else {
            reason = `Spend ${this.formatCurrency(spend)} below threshold ${this.formatCurrency(minSpend)}`;
        }
        return {
            ruleId: rule.id,
            ruleName: rule.name,
            condition,
            severity: rule.severity,
            triggered,
            reason,
            evaluatedAt,
            values: {
                current: conversions,
                threshold: minSpend,
            },
        };
    }
    operatorToString(operator) {
        switch (operator) {
            case 'GT': return '>';
            case 'LT': return '<';
            case 'GTE': return '>=';
            case 'LTE': return '<=';
            case 'EQ': return '=';
            default: return operator;
        }
    }
    formatNumber(num) {
        if (num === undefined || num === null)
            return 'N/A';
        if (Number.isInteger(num))
            return num.toString();
        return num.toFixed(4);
    }
    formatCurrency(num) {
        if (num === undefined || num === null)
            return 'N/A';
        return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
};
exports.AlertEngine = AlertEngine;
exports.AlertEngine = AlertEngine = __decorate([
    (0, tsyringe_1.injectable)()
], AlertEngine);
//# sourceMappingURL=alert-engine.service.js.map