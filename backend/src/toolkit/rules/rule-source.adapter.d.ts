import { IRuleProvider } from '../services/alert-execution.service';
import { IRuleSource } from './rule-source.fixture';
import { AlertRule } from './alert-rule.model';
export declare class RuleSourceAdapter implements IRuleProvider {
    private readonly source;
    constructor(source: IRuleSource);
    resolveRules(tenantId: string): Promise<AlertRule[]>;
}
export declare function adaptRuleSource(source: IRuleSource): IRuleProvider;
