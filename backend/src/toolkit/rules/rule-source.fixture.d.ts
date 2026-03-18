import { AlertRule } from './alert-rule.model';
import { RuleValidator } from './rule-validator';
import { ILogger } from '../core';
export interface IRuleSource {
    loadRules(tenantId: string): Promise<AlertRule[]>;
    getRule(ruleId: string): Promise<AlertRule | null>;
    clearCache(): void;
}
export declare class FixtureRuleSource implements IRuleSource {
    private cache;
    private readonly validator;
    private readonly logger;
    private readonly fixturesDir;
    constructor(validator: RuleValidator, logger: ILogger, fixturesDir?: string);
    loadRules(tenantId: string): Promise<AlertRule[]>;
    getRule(ruleId: string): Promise<AlertRule | null>;
    clearCache(): void;
    private loadAllRules;
    private loadFixtureFile;
    private resolveFixturesDir;
}
