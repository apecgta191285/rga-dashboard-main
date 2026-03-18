export type SimulationMode = 'FIXTURE' | 'GENERATED' | 'HYBRID';
export interface SimulationContext {
    readonly tenantId: string;
    readonly scenarioName: string;
    readonly dateRange: {
        readonly start: Date;
        readonly end: Date;
    };
    readonly mode: SimulationMode;
    readonly fixtureBasePath?: string;
    readonly seed?: string;
    readonly metricOverrides?: Record<string, number>;
    readonly correlationId: string;
    readonly description?: string;
}
export declare function createSimulationContext(params: Omit<SimulationContext, 'correlationId'> & {
    correlationId?: string;
}): SimulationContext;
export declare const PREDEFINED_SCENARIOS: {
    readonly 'drop-spend': {
        readonly description: "Campaign with significant spend drop from baseline";
        readonly defaultDateRange: {
            readonly days: 1;
        };
    };
    readonly 'zero-conversion': {
        readonly description: "Campaign spending with zero conversions";
        readonly defaultDateRange: {
            readonly days: 1;
        };
    };
    readonly 'high-roas': {
        readonly description: "Campaign with exceptionally high ROAS";
        readonly defaultDateRange: {
            readonly days: 1;
        };
    };
    readonly 'missing-metrics': {
        readonly description: "Campaign with incomplete metric data";
        readonly defaultDateRange: {
            readonly days: 1;
        };
    };
    readonly 'baseline-comparison': {
        readonly description: "Requires baseline for DROP_PERCENT evaluation";
        readonly defaultDateRange: {
            readonly days: 7;
        };
    };
};
export type PredefinedScenarioName = keyof typeof PREDEFINED_SCENARIOS;
export declare function createPredefinedScenarioContext(scenarioName: PredefinedScenarioName, tenantId: string, overrides?: Partial<Omit<SimulationContext, 'scenarioName' | 'tenantId'>>): SimulationContext;
