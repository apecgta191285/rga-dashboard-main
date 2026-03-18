import { VerificationRepository } from './verification.repository';
import { ScenarioLoader } from '../../toolkit/scenarios/scenario-loader';
import { VerificationOptions, VerificationResult } from './types';
import { AlertRuleEvaluator } from './rules/alert-rule.evaluator';
export declare class VerificationService {
    private readonly repository;
    private readonly scenarioLoader;
    private readonly ruleEvaluator;
    private readonly logger;
    constructor(repository: VerificationRepository, scenarioLoader: ScenarioLoader, ruleEvaluator: AlertRuleEvaluator);
    verifyScenario(options: VerificationOptions): Promise<VerificationResult>;
}
