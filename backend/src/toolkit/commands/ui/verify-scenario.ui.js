"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyScenarioUi = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const tsyringe_1 = require("tsyringe");
const ui_runner_1 = require("./ui-runner");
const verify_scenario_command_1 = require("../verify-scenario.command");
const scenario_loader_1 = require("../../scenarios/scenario-loader");
const prompts_1 = require("./prompts");
class VerifyScenarioUi {
    constructor() {
        this.name = 'verify-scenario';
    }
    async execute(tenantId, registry, args) {
        const scenarioLoader = tsyringe_1.container.resolve(scenario_loader_1.ScenarioLoader);
        const isHeadless = args?.headless === true || args?.nonInteractive === true;
        let scenario = args?.scenario;
        if (!scenario) {
            if (isHeadless) {
                throw new Error('ERROR: --scenario is required in headless mode');
            }
            scenario = await (0, prompts_1.promptForScenario)(scenarioLoader, 'Select scenario to verify:', 'baseline');
        }
        let dryRun = args?.dryRun !== false && args?.dryRun !== 'false';
        if (!isHeadless) {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'dryRun',
                    message: 'Dry run (verify logic/integrity but skip reporting)?',
                    default: dryRun,
                },
            ]);
            dryRun = answers.dryRun;
        }
        const command = new verify_scenario_command_1.VerifyScenarioCommand({
            tenantId,
            scenarioId: scenario,
            dryRun,
        });
        const { success, data } = await (0, ui_runner_1.runCommandSafe)(command, tenantId, registry, { dryRun });
        if (success) {
            this.displayResult(data);
        }
    }
    displayResult(result) {
        const verifyResult = result;
        if (verifyResult.status === 'FAIL') {
            console.log(chalk_1.default.red('\nERROR: Verification failed'));
        }
        else if (verifyResult.status === 'WARN') {
            console.log(chalk_1.default.yellow('\nWARNING: Verification completed with warnings'));
        }
        else {
            console.log(chalk_1.default.green('\nSUCCESS: Verification passed'));
        }
        console.log(chalk_1.default.gray(`Report: ${verifyResult.reportPath}`));
        if (verifyResult.summary) {
            const { passed, failed, warnings } = verifyResult.summary;
            console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
            console.log(chalk_1.default.cyan('\nVerification Summary(Legacy):'));
            console.log(chalk_1.default.green(`   Passed: ${passed}`));
            console.log(chalk_1.default.red(`   Failed: ${failed}`));
            console.log(chalk_1.default.yellow(`   Warnings: ${warnings}`));
            console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
        }
    }
}
exports.VerifyScenarioUi = VerifyScenarioUi;
//# sourceMappingURL=verify-scenario.ui.js.map