import { IRuleProvider } from '../services/alert-execution.service';
import { AlertRule } from '../rules/alert-rule.model';
import { SimulationContext } from './simulation-context';
export declare class MockRuleProvider implements IRuleProvider {
    private readonly context;
    private readonly source;
    constructor(context: SimulationContext);
    resolveRules(tenantId: string): Promise<AlertRule[]>;
    static clearCache(): void;
}
export declare const DEFAULT_RULES: AlertRule[];
