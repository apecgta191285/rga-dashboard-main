import { AlertRule } from './alert-rule.model';
import { RuleValidator, ValidationResult } from './rule-validator';
import { ILogger } from '../core';
import { IRuleSource } from './rule-source.fixture';
export declare class InMemoryRuleSource implements IRuleSource {
    private rules;
    private validator;
    private logger;
    constructor(validator?: RuleValidator, logger?: ILogger);
    loadRules(tenantId: string): Promise<AlertRule[]>;
    getRule(ruleId: string): Promise<AlertRule | null>;
    clearCache(): void;
    addRule(rule: AlertRule): ValidationResult;
    addRules(rules: AlertRule[]): ValidationResult;
    removeRule(ruleId: string): boolean;
    getAllRules(): AlertRule[];
    getRulesByTenant(tenantId: string): AlertRule[];
    hasRule(ruleId: string): boolean;
    get count(): number;
}
export declare function createRuleSource(rules: AlertRule[], validator?: RuleValidator, logger?: ILogger): InMemoryRuleSource;
export declare function createEmptyRuleSource(validator?: RuleValidator, logger?: ILogger): InMemoryRuleSource;
