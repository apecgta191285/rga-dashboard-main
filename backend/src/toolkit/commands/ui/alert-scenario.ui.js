"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertScenarioUi = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ui_runner_1 = require("./ui-runner");
const alert_scenario_command_1 = require("../definitions/alert-scenario.command");
class AlertScenarioUi {
    constructor() {
        this.name = 'alert-scenario';
    }
    async execute(tenantId, registry, args) {
        const { seedBaseline, injectAnomaly, days, dryRun } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'seedBaseline',
                message: 'Seed baseline historical data?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'injectAnomaly',
                message: 'Inject anomaly data?',
                default: true,
            },
            {
                type: 'number',
                name: 'days',
                message: 'Number of days for baseline data:',
                default: 30,
                validate: (input) => {
                    if (input < 1 || input > 365) {
                        return 'Please enter a value between 1 and 365';
                    }
                    return true;
                },
            },
            {
                type: 'confirm',
                name: 'dryRun',
                message: 'Dry run (recommended)?',
                default: true,
            },
        ]);
        const command = (0, alert_scenario_command_1.createAlertScenarioCommand)(tenantId, {
            seedBaseline,
            injectAnomaly,
            days,
        });
        const { success, data } = await (0, ui_runner_1.runCommandSafe)(command, tenantId, registry, { dryRun });
        if (success) {
            this.displayResult(data);
        }
    }
    displayResult(result) {
        const scenarioResult = result;
        if (!scenarioResult.success) {
            console.log(chalk_1.default.red('\nERROR: Alert scenario failed'));
            console.log(chalk_1.default.gray(scenarioResult.message));
            if (scenarioResult.error) {
                console.log(chalk_1.default.red(scenarioResult.error));
            }
            return;
        }
        if (scenarioResult.status === 'no_campaigns') {
            console.log(chalk_1.default.yellow('\nWARNING: No campaigns found'));
            console.log(chalk_1.default.gray(scenarioResult.message));
            console.log(chalk_1.default.cyan('\nSuggestions:'));
            console.log(chalk_1.default.gray('  - Create a campaign via API first'));
            console.log(chalk_1.default.gray('  - Enable auto-create option (not available in MVP)'));
            return;
        }
        if (scenarioResult.data) {
            const { seedResult, anomalyInjected, alertCheck } = scenarioResult.data;
            console.log(chalk_1.default.green('\nSUCCESS: Alert scenario completed'));
            console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
            console.log(chalk_1.default.cyan('\nStep 1: Baseline Data'));
            console.log(chalk_1.default.white(`   Rows Seeded: ${chalk_1.default.green(seedResult.seededCount)}`));
            console.log(chalk_1.default.white(`   Campaigns: ${chalk_1.default.green(seedResult.campaignCount)}`));
            console.log(chalk_1.default.white(`   Date Range: ${chalk_1.default.cyan(seedResult.dateRange.start)} to ${chalk_1.default.cyan(seedResult.dateRange.end)}`));
            console.log(chalk_1.default.cyan('\nStep 2: Anomaly Injection'));
            console.log(chalk_1.default.white(`   Status: ${anomalyInjected ? chalk_1.default.yellow('Injected') : chalk_1.default.gray('Skipped')}`));
            console.log(chalk_1.default.cyan('\nStep 3: Alert Evaluation'));
            console.log(chalk_1.default.white(`   Evaluated At: ${chalk_1.default.gray(alertCheck.evaluatedAt.toISOString())}`));
            console.log(chalk_1.default.white(`   Snapshots: ${chalk_1.default.green(alertCheck.metadata.snapshotsEvaluated)}`));
            console.log(chalk_1.default.white(`   Rules Evaluated: ${chalk_1.default.green(alertCheck.metadata.totalRulesEvaluated)}`));
            console.log(chalk_1.default.white(`   Alerts Triggered: ${alertCheck.triggeredAlerts.length > 0 ? chalk_1.default.red(alertCheck.triggeredAlerts.length) : chalk_1.default.green(0)}`));
            if (alertCheck.triggeredAlerts.length > 0) {
                console.log(chalk_1.default.cyan('\nTriggered Alerts:'));
                alertCheck.triggeredAlerts.forEach((alert, index) => {
                    const severityColor = alert.severity === 'CRITICAL' ? chalk_1.default.red :
                        alert.severity === 'HIGH' ? chalk_1.default.yellow :
                            alert.severity === 'MEDIUM' ? chalk_1.default.blue : chalk_1.default.gray;
                    console.log(chalk_1.default.gray(`   ${index + 1}. `) +
                        severityColor(`[${alert.severity}] `) +
                        chalk_1.default.white(alert.ruleName));
                    console.log(chalk_1.default.gray(`      Reason: ${alert.reason}`));
                });
            }
            console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
        }
    }
}
exports.AlertScenarioUi = AlertScenarioUi;
//# sourceMappingURL=alert-scenario.ui.js.map