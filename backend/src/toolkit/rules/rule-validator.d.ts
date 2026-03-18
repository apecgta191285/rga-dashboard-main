export interface RuleValidationError {
    readonly field: string;
    readonly code: string;
    readonly message: string;
}
export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: RuleValidationError[];
}
export declare class RuleValidator {
    validate(rule: unknown): ValidationResult;
    validateMany(rules: unknown[]): ValidationResult;
    private validateRequiredFields;
    private validateFieldTypes;
    private validateCondition;
    private validateThresholdCondition;
    private validateDropPercentCondition;
    private validateZeroConversionsCondition;
    private validateBusinessRules;
}
export declare const ruleValidator: RuleValidator;
