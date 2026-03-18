import { VerificationCheck } from '../types';
export interface EvaluatorInput {
    ruleId: string;
    name: string;
    logic: (metrics: any) => boolean;
    severity: 'FAIL' | 'WARN' | 'INFO';
    message: (metrics: any) => string;
}
export declare class AlertRuleEvaluator {
    evaluate(metrics: Record<string, any>, rules: EvaluatorInput[]): VerificationCheck[];
}
