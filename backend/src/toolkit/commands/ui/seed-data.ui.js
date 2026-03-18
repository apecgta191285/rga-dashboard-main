"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedDataUi = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ui_runner_1 = require("./ui-runner");
const seed_data_command_1 = require("../seed-data.command");
const platform_capabilities_1 = require("../../domain/platform-capabilities");
class SeedDataUi {
    constructor() {
        this.name = 'seed-data';
    }
    async execute(tenantId, registry, args) {
        const { platform, days, trend, anomaly, dryRun } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'platform',
                message: 'Select platform:',
                choices: platform_capabilities_1.SEEDABLE_PLATFORMS,
            },
            {
                type: 'number',
                name: 'days',
                message: 'Number of days to generate:',
                default: 30,
            },
            {
                type: 'list',
                name: 'trend',
                message: 'Trend pattern:',
                choices: ['stable', 'increasing', 'decreasing', 'seasonal', 'volatile'],
                default: 'stable',
            },
            {
                type: 'confirm',
                name: 'anomaly',
                message: 'Inject anomaly?',
                default: false,
            },
            {
                type: 'confirm',
                name: 'dryRun',
                message: 'Dry run (recommended)?',
                default: true,
            },
        ]);
        const command = new seed_data_command_1.SeedDataCommand({
            platform: platform,
            days,
            trend,
            injectAnomaly: anomaly,
        });
        const { success } = await (0, ui_runner_1.runCommandSafe)(command, tenantId, registry, { dryRun });
        if (success) {
            console.log(chalk_1.default.green('\nSUCCESS: Data seeding completed'));
        }
    }
}
exports.SeedDataUi = SeedDataUi;
//# sourceMappingURL=seed-data.ui.js.map