"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetTenantHardUi = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const tsyringe_1 = require("tsyringe");
const ui_runner_1 = require("./ui-runner");
const reset_tenant_command_1 = require("../definitions/reset-tenant.command");
const reset_tenant_handler_1 = require("../reset-tenant.handler");
const reset_tenant_common_1 = require("./reset-tenant.common");
class ResetTenantHardUi {
    constructor() {
        this.name = 'reset-tenant-hard';
    }
    async execute(tenantId, registry, args) {
        console.log(chalk_1.default.red.bold('\n[DANGER] HARD RESET - DESTRUCTIVE OPERATION\n'));
        console.log(chalk_1.default.red('This will DELETE:'));
        console.log(chalk_1.default.red('  - All metrics and historical data'));
        console.log(chalk_1.default.red('  - All campaign definitions'));
        console.log(chalk_1.default.red('  - All alert rules and definitions'));
        console.log(chalk_1.default.red('  - All alert history\n'));
        console.log(chalk_1.default.yellow('Preserved:'));
        console.log(chalk_1.default.yellow('  - Tenant identity'));
        console.log(chalk_1.default.yellow('  - User accounts'));
        console.log(chalk_1.default.yellow('  - Integration configurations\n'));
        const { generateToken } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'generateToken',
                message: 'Generate confirmation token?',
                default: false,
            },
        ]);
        if (!generateToken) {
            console.log(chalk_1.default.gray('\nOperation cancelled.\n'));
            return;
        }
        const handler = tsyringe_1.container.resolve(reset_tenant_handler_1.ResetTenantHardCommandHandler);
        const { token, expiresAt } = handler.generateConfirmationToken(tenantId);
        console.log(chalk_1.default.cyan('\nConfirmation Token Generated:'));
        console.log(chalk_1.default.white(`   Token: ${token}`));
        console.log(chalk_1.default.yellow(`   Expires: ${expiresAt.toISOString()}`));
        console.log(chalk_1.default.gray('   Valid for: 5 minutes\n'));
        const { confirmToken, finalConfirm, dryRun } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'confirmToken',
                message: 'Enter confirmation token to proceed:',
            },
            {
                type: 'confirm',
                name: 'finalConfirm',
                message: chalk_1.default.red.bold('FINAL CONFIRMATION: This CANNOT be undone. Proceed?'),
                default: false,
            },
            {
                type: 'confirm',
                name: 'dryRun',
                message: 'Dry run (recommended)?',
                default: true,
            },
        ]);
        if (confirmToken !== token) {
            console.log(chalk_1.default.red('\nERROR: Invalid confirmation token. Operation cancelled.\n'));
            return;
        }
        if (!finalConfirm) {
            console.log(chalk_1.default.gray('\nOperation cancelled.\n'));
            return;
        }
        const command = (0, reset_tenant_command_1.createResetTenantHardCommand)(tenantId, {
            mode: 'HARD',
            confirmedAt: new Date(),
            confirmationToken: token,
        });
        const { success, data } = await (0, ui_runner_1.runCommandSafe)(command, tenantId, registry, { dryRun });
        if (success) {
            (0, reset_tenant_common_1.displayResetTenantResult)(data);
        }
    }
}
exports.ResetTenantHardUi = ResetTenantHardUi;
//# sourceMappingURL=reset-tenant-hard.ui.js.map