"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayResetTenantResult = displayResetTenantResult;
const chalk_1 = __importDefault(require("chalk"));
function displayResetTenantResult(result) {
    const resetResult = result;
    if (!resetResult.success) {
        console.log(chalk_1.default.red('\nERROR: Reset failed'));
        console.log(chalk_1.default.gray(resetResult.message));
        if (resetResult.error) {
            console.log(chalk_1.default.red(resetResult.error));
        }
        return;
    }
    if (resetResult.data) {
        const { deletedMetrics, deletedAlerts, deletedCampaigns, deletedAlertDefinitions, durationMs } = resetResult.data;
        const mode = resetResult.mode;
        const isHard = mode === 'HARD';
        const color = isHard ? chalk_1.default.red : chalk_1.default.green;
        console.log(color(`\nSUCCESS: Tenant ${mode.toLowerCase()} reset completed`));
        console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
        console.log(chalk_1.default.cyan('\nDeletion Summary:\n'));
        console.log(chalk_1.default.white(`   Mode: ${isHard ? chalk_1.default.red.bold('HARD') : chalk_1.default.green('PARTIAL')}`));
        console.log(chalk_1.default.white(`   Metrics Deleted: ${chalk_1.default.yellow(deletedMetrics || 0)}`));
        console.log(chalk_1.default.white(`   Alert Records Deleted: ${chalk_1.default.yellow(deletedAlerts || 0)}`));
        if (isHard) {
            console.log(chalk_1.default.red(`   Campaigns Deleted: ${deletedCampaigns || 0}`));
            console.log(chalk_1.default.red(`   Alert Rules Deleted: ${deletedAlertDefinitions || 0}`));
        }
        else {
            console.log(chalk_1.default.gray('   Campaigns: Preserved'));
            console.log(chalk_1.default.gray('   Alert Rules: Preserved'));
        }
        console.log(chalk_1.default.gray(`\n   Duration: ${durationMs}ms`));
        if (isHard) {
            console.log(chalk_1.default.red.bold('\nWARNING: Hard reset was performed.'));
            console.log(chalk_1.default.red('   Campaigns and alert rules must be recreated from scratch.'));
        }
        console.log(chalk_1.default.gray('\n' + '-'.repeat(60)));
    }
}
//# sourceMappingURL=reset-tenant.common.js.map