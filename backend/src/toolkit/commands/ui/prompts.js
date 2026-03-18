"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptForTenant = promptForTenant;
exports.promptForTenantManual = promptForTenantManual;
exports.promptForScenario = promptForScenario;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const contracts_1 = require("../../core/contracts");
const MANUAL_TENANT_OPTION = '__MANUAL_TENANT__';
const MANUAL_SCENARIO_OPTION = '__MANUAL_SCENARIO__';
async function promptForTenant(prisma) {
    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            slug: true,
            name: true,
        },
        orderBy: [{ name: 'asc' }],
        take: 200,
    });
    if (tenants.length === 0) {
        console.log(chalk_1.default.yellow('\nWARNING: No tenants found in database. Enter tenant ID manually.\n'));
        return promptForTenantManual();
    }
    const tenantChoices = tenants.map((tenant) => ({
        name: `${tenant.name} (${tenant.slug}) [${tenant.id.slice(0, 8)}]`,
        value: tenant.id,
    }));
    const { selectedTenantId } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'selectedTenantId',
            message: 'Select tenant:',
            choices: [
                ...tenantChoices,
                new inquirer_1.default.Separator(chalk_1.default.gray('-'.repeat(45))),
                { name: 'Enter tenant ID manually', value: MANUAL_TENANT_OPTION },
            ],
            pageSize: 16,
        },
    ]);
    if (selectedTenantId === MANUAL_TENANT_OPTION) {
        return promptForTenantManual();
    }
    return (0, contracts_1.createTenantId)(String(selectedTenantId));
}
async function promptForTenantManual() {
    const { tenantId } = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'tenantId',
            message: 'Enter tenant ID (or leave blank to skip):',
        },
    ]);
    const normalizedTenantId = typeof tenantId === 'string' ? tenantId.trim() : '';
    return normalizedTenantId ? (0, contracts_1.createTenantId)(normalizedTenantId) : null;
}
async function promptForScenario(scenarioLoader, message, fallbackScenarioId = 'baseline') {
    const scenarios = await scenarioLoader.listAvailableScenarios();
    if (scenarios.length === 0) {
        const { scenarioId } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'scenarioId',
                message,
                default: fallbackScenarioId,
                validate: (input) => input.trim().length > 0 ? true : 'Scenario ID is required',
            },
        ]);
        return String(scenarioId).trim();
    }
    const choices = scenarios.map((scenario) => {
        const aliasLabel = scenario.aliases.length > 0 ? ` (aliases: ${scenario.aliases.join(', ')})` : '';
        return {
            name: `${scenario.scenarioId}: ${scenario.name}${aliasLabel}`,
            value: scenario.scenarioId,
        };
    });
    const { selectedScenarioId } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'selectedScenarioId',
            message,
            choices: [
                ...choices,
                new inquirer_1.default.Separator(chalk_1.default.gray('-'.repeat(45))),
                { name: 'Enter scenario ID manually', value: MANUAL_SCENARIO_OPTION },
            ],
            default: scenarios.some((s) => s.scenarioId === fallbackScenarioId)
                ? fallbackScenarioId
                : scenarios[0].scenarioId,
            pageSize: 16,
        },
    ]);
    if (selectedScenarioId === MANUAL_SCENARIO_OPTION) {
        const { scenarioId } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'scenarioId',
                message: 'Enter scenario ID:',
                default: fallbackScenarioId,
                validate: (input) => input.trim().length > 0 ? true : 'Scenario ID is required',
            },
        ]);
        return String(scenarioId).trim();
    }
    return String(selectedScenarioId);
}
//# sourceMappingURL=prompts.js.map