"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedUnifiedUi = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const tsyringe_1 = require("tsyringe");
const ui_runner_1 = require("./ui-runner");
const seed_unified_command_1 = require("../seed-unified.command");
const scenario_loader_1 = require("../../scenarios/scenario-loader");
const prompts_1 = require("./prompts");
class SeedUnifiedUi {
    constructor() {
        this.name = 'seed-unified-scenario';
    }
    async execute(tenantId, registry, args) {
        const scenarioLoader = tsyringe_1.container.resolve(scenario_loader_1.ScenarioLoader);
        const isHeadless = args?.headless === true || args?.nonInteractive === true;
        let scenario = args?.scenario;
        if (!scenario) {
            if (isHeadless) {
                throw new Error('ERROR: --scenario is required in headless mode');
            }
            scenario = await (0, prompts_1.promptForScenario)(scenarioLoader, 'Select scenario to seed:', 'baseline');
        }
        let mode = args?.mode;
        let seed = args?.seed ? Number(args.seed) : 12345;
        let days = args?.days ? Number(args.days) : 30;
        let platforms = args?.platforms || '';
        let allowReal = args?.allowReal === true || args?.allowReal === 'true';
        let dryRun = args?.dryRun !== false && args?.dryRun !== 'false';
        if (!isHeadless) {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'mode',
                    message: 'Execution Mode:',
                    choices: [
                        { name: '[Generated] Simulate from seed', value: 'GENERATED' },
                        { name: '[Fixture] Load golden file', value: 'FIXTURE' },
                        { name: '[Hybrid] Validate match', value: 'HYBRID' }
                    ],
                    default: mode || 'GENERATED'
                },
                {
                    type: 'number',
                    name: 'seed',
                    message: 'Deterministic seed (integer):',
                    default: seed,
                },
                {
                    type: 'number',
                    name: 'days',
                    message: 'Days of history:',
                    default: days,
                },
                {
                    type: 'input',
                    name: 'platforms',
                    message: 'Platforms (CSV, blank=all seedable: google,facebook,tiktok,line,shopee,lazada):',
                    default: platforms,
                },
                {
                    type: 'confirm',
                    name: 'allowReal',
                    message: 'Allow seeding on tenant with real data?',
                    default: allowReal,
                },
                {
                    type: 'confirm',
                    name: 'dryRun',
                    message: 'Dry run (recommended)?',
                    default: dryRun,
                },
            ]);
            mode = answers.mode;
            seed = answers.seed;
            days = answers.days;
            platforms = answers.platforms;
            allowReal = answers.allowReal;
            dryRun = answers.dryRun;
        }
        const command = new seed_unified_command_1.SeedUnifiedCommand({
            tenant: tenantId,
            scenario,
            mode: mode || 'GENERATED',
            seed,
            days,
            platforms: platforms || undefined,
            dryRun,
            allowRealTenant: allowReal,
        });
        const { success, data } = await (0, ui_runner_1.runCommandSafe)(command, tenantId, registry, { dryRun });
        if (success) {
            this.displayResult(data);
        }
    }
    displayResult(result) {
        console.log(chalk_1.default.green(`\nSUCCESS: Unified Seed Completed`));
        console.log(chalk_1.default.gray(`Source Tag: ${result.sourceTag}`));
        console.log(chalk_1.default.gray(`Rows Created: ${result.rowsCreated}`));
        console.log(chalk_1.default.gray(`Platforms: ${result.platformsProcessed.join(', ')}`));
        if (result.manifestPath) {
            console.log(chalk_1.default.gray(`Manifest: ${result.manifestPath}`));
        }
        const args = result.manifest?.config?.args;
        if (args) {
            console.log(chalk_1.default.white(`   Scenario: ${chalk_1.default.cyan(args.scenario)}`));
            console.log(chalk_1.default.white(`   Seed: ${chalk_1.default.yellow(args.seed)}`));
            console.log(chalk_1.default.white(`   Days: ${chalk_1.default.yellow(args.days)}`));
        }
        console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
    }
}
exports.SeedUnifiedUi = SeedUnifiedUi;
//# sourceMappingURL=seed-unified.ui.js.map