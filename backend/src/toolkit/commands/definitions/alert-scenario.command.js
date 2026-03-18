"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALERT_SCENARIO_COMMAND = void 0;
exports.createAlertScenarioCommand = createAlertScenarioCommand;
exports.ALERT_SCENARIO_COMMAND = 'alert-scenario';
function createAlertScenarioCommand(tenantId, options = {}) {
    return {
        name: exports.ALERT_SCENARIO_COMMAND,
        description: 'Run alert scenario with baseline seeding and anomaly injection',
        requiresConfirmation: true,
        tenantId,
        seedBaseline: options.seedBaseline ?? true,
        injectAnomaly: options.injectAnomaly ?? true,
        days: options.days ?? 30,
    };
}
//# sourceMappingURL=alert-scenario.command.js.map