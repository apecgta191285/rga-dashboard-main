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
exports.InMemoryRuleSource = void 0;
exports.createRuleSource = createRuleSource;
exports.createEmptyRuleSource = createEmptyRuleSource;
const tsyringe_1 = require("tsyringe");
const rule_validator_1 = require("./rule-validator");
const core_1 = require("../core");
let InMemoryRuleSource = class InMemoryRuleSource {
    constructor(validator, logger) {
        this.rules = new Map();
        this.validator = validator ?? new rule_validator_1.RuleValidator();
        this.logger = (logger ?? console).child({ source: 'InMemoryRuleSource' });
    }
    async loadRules(tenantId) {
        const tenantRules = Array.from(this.rules.values())
            .filter((r) => r.tenantId === tenantId && r.enabled);
        this.logger.debug(`Loaded ${tenantRules.length} rules for tenant ${tenantId}`);
        return tenantRules;
    }
    async getRule(ruleId) {
        return this.rules.get(ruleId) ?? null;
    }
    clearCache() {
        this.rules.clear();
        this.logger.debug('Cleared all rules from memory');
    }
    addRule(rule) {
        const result = this.validator.validate(rule);
        if (!result.valid) {
            this.logger.warn(`Validation failed for rule ${rule.id}: ${result.errors.length} errors`);
            return result;
        }
        this.rules.set(rule.id, rule);
        this.logger.debug(`Added/updated rule ${rule.id} (${rule.name})`);
        return result;
    }
    addRules(rules) {
        for (const rule of rules) {
            const result = this.addRule(rule);
            if (!result.valid) {
                return {
                    valid: false,
                    errors: result.errors.map((e) => ({
                        ...e,
                        field: `rule[${rule.id}].${e.field}`,
                    })),
                };
            }
        }
        return { valid: true, errors: [] };
    }
    removeRule(ruleId) {
        const existed = this.rules.delete(ruleId);
        if (existed) {
            this.logger.debug(`Removed rule ${ruleId}`);
        }
        return existed;
    }
    getAllRules() {
        return Array.from(this.rules.values());
    }
    getRulesByTenant(tenantId) {
        return Array.from(this.rules.values())
            .filter((r) => r.tenantId === tenantId);
    }
    hasRule(ruleId) {
        return this.rules.has(ruleId);
    }
    get count() {
        return this.rules.size;
    }
};
exports.InMemoryRuleSource = InMemoryRuleSource;
exports.InMemoryRuleSource = InMemoryRuleSource = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(rule_validator_1.RuleValidator)),
    __param(1, (0, tsyringe_1.inject)(core_1.TOKENS.Logger)),
    __metadata("design:paramtypes", [rule_validator_1.RuleValidator, Object])
], InMemoryRuleSource);
function createRuleSource(rules, validator, logger) {
    const source = new InMemoryRuleSource(validator, logger);
    const result = source.addRules(rules);
    if (!result.valid) {
        const errors = result.errors.map((e) => `[${e.field}] ${e.message}`).join('\n');
        throw new Error(`Failed to create rule source:\n${errors}`);
    }
    return source;
}
function createEmptyRuleSource(validator, logger) {
    return new InMemoryRuleSource(validator, logger);
}
//# sourceMappingURL=rule-source.memory.js.map