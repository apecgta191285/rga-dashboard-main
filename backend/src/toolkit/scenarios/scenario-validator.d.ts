export interface ScenarioValidationResult {
    valid: boolean;
    errors: ScenarioValidationError[];
    scenarioId: string;
}
export interface ScenarioValidationError {
    field: string;
    code: string;
    message: string;
    isRecoverable: boolean;
}
export declare function validateScenarioSpec(raw: unknown, scenarioId: string): ScenarioValidationResult;
