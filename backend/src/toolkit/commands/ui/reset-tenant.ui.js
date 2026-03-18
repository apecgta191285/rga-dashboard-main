"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetTenantUi = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ui_runner_1 = require("./ui-runner");
const reset_tenant_command_1 = require("../definitions/reset-tenant.command");
const reset_tenant_common_1 = require("./reset-tenant.common");
class ResetTenantUi {
    constructor() {
        this.name = 'reset-tenant';
    }
    async execute(tenantId, registry, args) {
        const { confirm, dryRun } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: chalk_1.default.yellow('This will delete all metrics and alert history. Campaigns and alert rules will be preserved. Continue?'),
                default: false,
            },
            {
                type: 'confirm',
                name: 'dryRun',
                message: 'Dry run (recommended)?',
                default: true,
            },
        ]);
        if (!confirm) {
            console.log(chalk_1.default.gray('\nOperation cancelled.\n'));
            return;
        }
        const command = (0, reset_tenant_command_1.createResetTenantCommand)(tenantId);
        const { success, data } = await (0, ui_runner_1.runCommandSafe)(command, tenantId, registry, { dryRun });
        if (success) {
            (0, reset_tenant_common_1.displayResetTenantResult)(data);
        }
    }
}
exports.ResetTenantUi = ResetTenantUi;
//# sourceMappingURL=reset-tenant.ui.js.map