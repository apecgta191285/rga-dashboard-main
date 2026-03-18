"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedGoogleAdsUi = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ui_runner_1 = require("./ui-runner");
const seed_google_ads_command_1 = require("../definitions/seed-google-ads.command");
class SeedGoogleAdsUi {
    constructor() {
        this.name = 'seed-google-ads';
    }
    async execute(tenantId, registry, args) {
        const { days, dryRun } = await inquirer_1.default.prompt([
            {
                type: 'number',
                name: 'days',
                message: 'Number of days to generate:',
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
        const command = (0, seed_google_ads_command_1.createSeedGoogleAdsCommand)(tenantId, days);
        const { success, data } = await (0, ui_runner_1.runCommandSafe)(command, tenantId, registry, { dryRun });
        if (success) {
            this.displayResult(data);
        }
    }
    displayResult(result) {
        const seederResult = result;
        if (!seederResult.success) {
            console.log(chalk_1.default.red('\nERROR: Seeding failed'));
            console.log(chalk_1.default.gray(seederResult.message));
            if (seederResult.error) {
                console.log(chalk_1.default.red(seederResult.error));
            }
            return;
        }
        if (seederResult.status === 'no_campaigns') {
            console.log(chalk_1.default.yellow('\nWARNING: No campaigns found'));
            console.log(chalk_1.default.gray(seederResult.message));
            console.log(chalk_1.default.cyan('\nSuggestions:'));
            console.log(chalk_1.default.gray('  - Connect Google Ads integration first'));
            console.log(chalk_1.default.gray('  - Create a test campaign via API'));
            console.log(chalk_1.default.gray('  - Run the Alert Scenario action (it can auto-create campaigns)'));
            return;
        }
        if (seederResult.data) {
            const { seededCount, campaignCount, dateRange, campaigns } = seederResult.data;
            console.log(chalk_1.default.green('\nSUCCESS: Google Ads historical data seeded'));
            console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
            console.log(chalk_1.default.cyan('\nSummary:\n'));
            console.log(chalk_1.default.white(`   Total Rows Seeded: ${chalk_1.default.green(seededCount || 0)}`));
            console.log(chalk_1.default.white(`   Campaigns Updated: ${chalk_1.default.green(campaignCount || 0)}`));
            if (dateRange) {
                console.log(chalk_1.default.white(`   Date Range: ${chalk_1.default.cyan(dateRange.start)} to ${chalk_1.default.cyan(dateRange.end)}`));
            }
            if (campaigns && campaigns.length > 0) {
                console.log(chalk_1.default.cyan('\nCampaigns:'));
                campaigns.forEach((campaign, index) => {
                    console.log(chalk_1.default.gray(`   ${index + 1}. `) +
                        chalk_1.default.white(campaign.name) +
                        chalk_1.default.gray(` (${campaign.rowsCreated} rows, ${campaign.trendProfile})`));
                });
            }
            console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
        }
    }
}
exports.SeedGoogleAdsUi = SeedGoogleAdsUi;
//# sourceMappingURL=seed-google-ads.ui.js.map