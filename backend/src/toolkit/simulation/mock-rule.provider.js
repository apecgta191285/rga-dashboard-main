"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RULES = exports.MockRuleProvider = void 0;
const rules_1 = require("../rules");
class MockRuleProvider {
    constructor(context) {
        this.context = context;
        this.source = new rules_1.FixtureRuleSource(new rules_1.RuleValidator(), undefined, this.context.fixtureBasePath
            ? `${this.context.fixtureBasePath}/rules`
            : undefined);
    }
    async resolveRules(tenantId) {
        if (tenantId !== this.context.tenantId) {
            throw new Error(`Tenant mismatch: provider configured for ${this.context.tenantId}, ` +
                `but resolveRules called with ${tenantId}`);
        }
        const rules = await this.source.loadRules(tenantId);
        if (rules.length === 0) {
            return exports.DEFAULT_RULES;
        }
        return rules;
    }
    static clearCache() {
    }
}
exports.MockRuleProvider = MockRuleProvider;
exports.DEFAULT_RULES = [
    {
        id: 'rule-high-spend',
        tenantId: 'tenant-1',
        name: 'High Daily Spend',
        condition: {
            type: 'THRESHOLD',
            metric: 'spend',
            operator: 'GT',
            value: 10000,
        },
        severity: 'HIGH',
        scope: 'CAMPAIGN',
        enabled: true,
    },
    {
        id: 'rule-zero-conversions',
        tenantId: 'tenant-1',
        name: 'Budget Burn - Zero Conversions',
        condition: {
            type: 'ZERO_CONVERSIONS',
            minSpend: 5000,
        },
        severity: 'CRITICAL',
        scope: 'CAMPAIGN',
        enabled: true,
    },
    {
        id: 'rule-low-roas',
        tenantId: 'tenant-1',
        name: 'Low ROAS',
        condition: {
            type: 'THRESHOLD',
            metric: 'roas',
            operator: 'LT',
            value: 1.0,
        },
        severity: 'MEDIUM',
        scope: 'CAMPAIGN',
        enabled: true,
    },
    {
        id: 'rule-high-ctr-drop',
        tenantId: 'tenant-1',
        name: 'CTR Significant Drop',
        condition: {
            type: 'DROP_PERCENT',
            metric: 'ctr',
            thresholdPercent: 30,
        },
        severity: 'HIGH',
        scope: 'CAMPAIGN',
        enabled: true,
    },
    {
        id: 'rule-low-conversion-rate',
        tenantId: 'tenant-1',
        name: 'Low Conversion Rate',
        condition: {
            type: 'THRESHOLD',
            metric: 'cvr',
            operator: 'LT',
            value: 0.01,
        },
        severity: 'LOW',
        scope: 'CAMPAIGN',
        enabled: false,
    },
];
//# sourceMappingURL=mock-rule.provider.js.map