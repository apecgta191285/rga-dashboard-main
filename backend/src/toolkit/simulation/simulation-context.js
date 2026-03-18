"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREDEFINED_SCENARIOS = void 0;
exports.createSimulationContext = createSimulationContext;
exports.createPredefinedScenarioContext = createPredefinedScenarioContext;
function createSimulationContext(params) {
    const context = {
        ...params,
        correlationId: params.correlationId ?? `sim-${Date.now()}-${params.scenarioName}`,
        fixtureBasePath: params.fixtureBasePath ?? './fixtures',
    };
    return Object.freeze(context);
}
exports.PREDEFINED_SCENARIOS = {
    'drop-spend': {
        description: 'Campaign with significant spend drop from baseline',
        defaultDateRange: { days: 1 },
    },
    'zero-conversion': {
        description: 'Campaign spending with zero conversions',
        defaultDateRange: { days: 1 },
    },
    'high-roas': {
        description: 'Campaign with exceptionally high ROAS',
        defaultDateRange: { days: 1 },
    },
    'missing-metrics': {
        description: 'Campaign with incomplete metric data',
        defaultDateRange: { days: 1 },
    },
    'baseline-comparison': {
        description: 'Requires baseline for DROP_PERCENT evaluation',
        defaultDateRange: { days: 7 },
    },
};
function createPredefinedScenarioContext(scenarioName, tenantId, overrides) {
    const predefined = exports.PREDEFINED_SCENARIOS[scenarioName];
    const days = predefined.defaultDateRange.days;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    return createSimulationContext({
        tenantId,
        scenarioName,
        dateRange: { start, end },
        mode: 'FIXTURE',
        description: predefined.description,
        ...overrides,
    });
}
//# sourceMappingURL=simulation-context.js.map