"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANOMALY_RULES = exports.BIZ_RULES = void 0;
exports.BIZ_RULES = [
    {
        ruleId: 'BIZ-001',
        name: 'LOW_ROAS',
        severity: 'WARN',
        logic: (m) => {
            const roas = m.spend > 0 ? m.revenue / m.spend : 0;
            return m.spend > 0 && roas < 1.0;
        },
        message: (m) => `ROAS ${(m.revenue / m.spend).toFixed(2)} < 1.0 (Loss)`
    },
    {
        ruleId: 'BIZ-002',
        name: 'CRITICAL_ROAS',
        severity: 'WARN',
        logic: (m) => {
            const roas = m.spend > 0 ? m.revenue / m.spend : 0;
            return m.spend > 0 && roas < 0.5;
        },
        message: (m) => `ROAS ${(m.revenue / m.spend).toFixed(2)} < 0.5 (Critical Loss)`
    },
    {
        ruleId: 'BIZ-004',
        name: 'NO_CONVERSIONS',
        severity: 'WARN',
        logic: (m) => m.spend > 0 && m.conversions === 0,
        message: (m) => `Spent ${m.spend.toFixed(2)} but got 0 conversions`
    },
];
exports.ANOMALY_RULES = [
    {
        ruleId: 'SANE-001',
        name: 'CLICKS_LE_IMPRESSIONS',
        severity: 'FAIL',
        logic: (m) => m.clicks > m.impressions,
        message: (m) => `Clicks (${m.clicks}) > Impressions (${m.impressions})`
    },
    {
        ruleId: 'SANE-003',
        name: 'SPEND_NON_NEGATIVE',
        severity: 'FAIL',
        logic: (m) => m.spend < 0,
        message: (m) => `Spend is negative (${m.spend})`
    }
];
//# sourceMappingURL=rule-catalog.js.map