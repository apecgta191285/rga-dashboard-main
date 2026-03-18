"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ruleValidator = exports.RuleValidator = void 0;
const VALID_METRICS = [
    'impressions',
    'clicks',
    'conversions',
    'spend',
    'revenue',
    'ctr',
    'cpc',
    'cvr',
    'roas',
];
const VALID_OPERATORS = ['GT', 'LT', 'GTE', 'LTE', 'EQ'];
const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_SCOPES = ['CAMPAIGN', 'ACCOUNT'];
class RuleValidator {
    validate(rule) {
        const errors = [];
        if (typeof rule !== 'object' || rule === null) {
            return {
                valid: false,
                errors: [{
                        field: '(root)',
                        code: 'NOT_AN_OBJECT',
                        message: 'Rule must be an object',
                    }],
            };
        }
        const r = rule;
        errors.push(...this.validateRequiredFields(r));
        errors.push(...this.validateFieldTypes(r));
        if (r.condition && typeof r.condition === 'object') {
            errors.push(...this.validateCondition(r.condition));
        }
        if (errors.length === 0) {
            errors.push(...this.validateBusinessRules(r));
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    validateMany(rules) {
        const allErrors = [];
        for (let i = 0; i < rules.length; i++) {
            const result = this.validate(rules[i]);
            if (!result.valid) {
                allErrors.push(...result.errors.map((e) => ({
                    ...e,
                    field: `[${i}].${e.field}`,
                })));
            }
        }
        return {
            valid: allErrors.length === 0,
            errors: allErrors,
        };
    }
    validateRequiredFields(r) {
        const errors = [];
        const required = ['id', 'tenantId', 'name', 'enabled', 'severity', 'scope', 'condition'];
        for (const field of required) {
            if (!(field in r) || r[field] === undefined || r[field] === null) {
                errors.push({
                    field,
                    code: 'REQUIRED_FIELD_MISSING',
                    message: `Required field "${field}" is missing`,
                });
            }
        }
        return errors;
    }
    validateFieldTypes(r) {
        const errors = [];
        if (r.id !== undefined && typeof r.id !== 'string') {
            errors.push({
                field: 'id',
                code: 'INVALID_TYPE',
                message: 'Field "id" must be a string',
            });
        }
        if (r.tenantId !== undefined && typeof r.tenantId !== 'string') {
            errors.push({
                field: 'tenantId',
                code: 'INVALID_TYPE',
                message: 'Field "tenantId" must be a string',
            });
        }
        if (r.name !== undefined) {
            if (typeof r.name !== 'string') {
                errors.push({
                    field: 'name',
                    code: 'INVALID_TYPE',
                    message: 'Field "name" must be a string',
                });
            }
            else if (r.name.trim().length === 0) {
                errors.push({
                    field: 'name',
                    code: 'EMPTY_STRING',
                    message: 'Field "name" cannot be empty',
                });
            }
        }
        if (r.enabled !== undefined && typeof r.enabled !== 'boolean') {
            errors.push({
                field: 'enabled',
                code: 'INVALID_TYPE',
                message: 'Field "enabled" must be a boolean',
            });
        }
        if (r.severity !== undefined) {
            if (!VALID_SEVERITIES.includes(r.severity)) {
                errors.push({
                    field: 'severity',
                    code: 'INVALID_VALUE',
                    message: `Field "severity" must be one of: ${VALID_SEVERITIES.join(', ')}`,
                });
            }
        }
        if (r.scope !== undefined) {
            if (!VALID_SCOPES.includes(r.scope)) {
                errors.push({
                    field: 'scope',
                    code: 'INVALID_VALUE',
                    message: `Field "scope" must be one of: ${VALID_SCOPES.join(', ')}`,
                });
            }
        }
        if (r.condition !== undefined) {
            if (typeof r.condition !== 'object' || r.condition === null) {
                errors.push({
                    field: 'condition',
                    code: 'INVALID_TYPE',
                    message: 'Field "condition" must be an object',
                });
            }
        }
        return errors;
    }
    validateCondition(condition) {
        const errors = [];
        if (!('type' in condition)) {
            return [{
                    field: 'condition.type',
                    code: 'REQUIRED_FIELD_MISSING',
                    message: 'Condition must have a "type" field',
                }];
        }
        switch (condition.type) {
            case 'THRESHOLD':
                errors.push(...this.validateThresholdCondition(condition));
                break;
            case 'DROP_PERCENT':
                errors.push(...this.validateDropPercentCondition(condition));
                break;
            case 'ZERO_CONVERSIONS':
                errors.push(...this.validateZeroConversionsCondition(condition));
                break;
            default:
                errors.push({
                    field: 'condition.type',
                    code: 'INVALID_VALUE',
                    message: `Unknown condition type: ${condition.type}`,
                });
        }
        return errors;
    }
    validateThresholdCondition(condition) {
        const errors = [];
        if (!condition.metric) {
            errors.push({
                field: 'condition.metric',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'THRESHOLD condition requires a "metric" field',
            });
        }
        else if (!VALID_METRICS.includes(condition.metric)) {
            errors.push({
                field: 'condition.metric',
                code: 'INVALID_VALUE',
                message: `Invalid metric "${condition.metric}". Valid: ${VALID_METRICS.join(', ')}`,
            });
        }
        if (!condition.operator) {
            errors.push({
                field: 'condition.operator',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'THRESHOLD condition requires an "operator" field',
            });
        }
        else if (!VALID_OPERATORS.includes(condition.operator)) {
            errors.push({
                field: 'condition.operator',
                code: 'INVALID_VALUE',
                message: `Invalid operator "${condition.operator}". Valid: ${VALID_OPERATORS.join(', ')}`,
            });
        }
        if (condition.value === undefined || condition.value === null) {
            errors.push({
                field: 'condition.value',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'THRESHOLD condition requires a "value" field',
            });
        }
        else if (typeof condition.value !== 'number' || isNaN(condition.value)) {
            errors.push({
                field: 'condition.value',
                code: 'INVALID_TYPE',
                message: 'THRESHOLD condition "value" must be a number',
            });
        }
        return errors;
    }
    validateDropPercentCondition(condition) {
        const errors = [];
        if (!condition.metric) {
            errors.push({
                field: 'condition.metric',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'DROP_PERCENT condition requires a "metric" field',
            });
        }
        else if (!VALID_METRICS.includes(condition.metric)) {
            errors.push({
                field: 'condition.metric',
                code: 'INVALID_VALUE',
                message: `Invalid metric "${condition.metric}". Valid: ${VALID_METRICS.join(', ')}`,
            });
        }
        if (condition.thresholdPercent === undefined || condition.thresholdPercent === null) {
            errors.push({
                field: 'condition.thresholdPercent',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'DROP_PERCENT condition requires a "thresholdPercent" field',
            });
        }
        else if (typeof condition.thresholdPercent !== 'number' ||
            isNaN(condition.thresholdPercent) ||
            condition.thresholdPercent < 0 ||
            condition.thresholdPercent > 100) {
            errors.push({
                field: 'condition.thresholdPercent',
                code: 'INVALID_VALUE',
                message: 'DROP_PERCENT "thresholdPercent" must be a number between 0 and 100',
            });
        }
        return errors;
    }
    validateZeroConversionsCondition(condition) {
        const errors = [];
        if (condition.minSpend === undefined || condition.minSpend === null) {
            errors.push({
                field: 'condition.minSpend',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'ZERO_CONVERSIONS condition requires a "minSpend" field',
            });
        }
        else if (typeof condition.minSpend !== 'number' ||
            isNaN(condition.minSpend) ||
            condition.minSpend < 0) {
            errors.push({
                field: 'condition.minSpend',
                code: 'INVALID_VALUE',
                message: 'ZERO_CONVERSIONS "minSpend" must be a non-negative number',
            });
        }
        return errors;
    }
    validateBusinessRules(rule) {
        const errors = [];
        if (rule.condition?.type === 'THRESHOLD') {
            const threshold = rule.condition.value;
            if (threshold < 0) {
                errors.push({
                    field: 'condition.value',
                    code: 'SUSPICIOUS_VALUE',
                    message: `Threshold value ${threshold} is negative - is this intentional?`,
                });
            }
        }
        if (rule.condition?.type === 'DROP_PERCENT') {
            const threshold = rule.condition.thresholdPercent;
            if (threshold === 0) {
                errors.push({
                    field: 'condition.thresholdPercent',
                    code: 'SUSPICIOUS_VALUE',
                    message: 'DROP_PERCENT threshold of 0% will trigger on any decrease - is this intentional?',
                });
            }
        }
        return errors;
    }
}
exports.RuleValidator = RuleValidator;
exports.ruleValidator = new RuleValidator();
//# sourceMappingURL=rule-validator.js.map