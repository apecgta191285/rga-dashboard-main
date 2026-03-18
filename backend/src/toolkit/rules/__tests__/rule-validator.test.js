"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const rule_validator_1 = require("../rule-validator");
function validThresholdRule() {
    return {
        id: 'rule-test-001',
        tenantId: 'tenant-1',
        name: 'High CPC Alert',
        enabled: true,
        severity: 'HIGH',
        scope: 'CAMPAIGN',
        condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'GT', value: 5.0 },
    };
}
function validDropRule() {
    return {
        id: 'rule-test-002',
        tenantId: 'tenant-1',
        name: 'Click Drop Alert',
        enabled: true,
        severity: 'MEDIUM',
        scope: 'ACCOUNT',
        condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: 30 },
    };
}
function validZeroConvRule() {
    return {
        id: 'rule-test-003',
        tenantId: 'tenant-1',
        name: 'Zero Conversions Alert',
        enabled: true,
        severity: 'CRITICAL',
        scope: 'CAMPAIGN',
        condition: { type: 'ZERO_CONVERSIONS', minSpend: 100 },
    };
}
function hasCode(result, code) {
    return result.errors.some((e) => e.code === code);
}
function hasField(result, field) {
    return result.errors.some((e) => e.field === field);
}
(0, node_test_1.describe)('RuleValidator — valid rules pass', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('THRESHOLD rule passes', () => {
        const r = v.validate(validThresholdRule());
        node_assert_1.strict.ok(r.valid, `Expected valid, got errors: ${JSON.stringify(r.errors)}`);
        node_assert_1.strict.strictEqual(r.errors.length, 0);
    });
    (0, node_test_1.it)('DROP_PERCENT rule passes', () => {
        const r = v.validate(validDropRule());
        node_assert_1.strict.ok(r.valid, JSON.stringify(r.errors));
    });
    (0, node_test_1.it)('ZERO_CONVERSIONS rule passes', () => {
        const r = v.validate(validZeroConvRule());
        node_assert_1.strict.ok(r.valid, JSON.stringify(r.errors));
    });
});
(0, node_test_1.describe)('RuleValidator — root type check', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('rejects null', () => {
        const r = v.validate(null);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'NOT_AN_OBJECT'));
    });
    (0, node_test_1.it)('rejects undefined', () => {
        const r = v.validate(undefined);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'NOT_AN_OBJECT'));
    });
    (0, node_test_1.it)('rejects string', () => {
        const r = v.validate('not a rule');
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'NOT_AN_OBJECT'));
    });
    (0, node_test_1.it)('rejects number', () => {
        const r = v.validate(42);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'NOT_AN_OBJECT'));
    });
});
(0, node_test_1.describe)('RuleValidator — required fields', () => {
    const v = new rule_validator_1.RuleValidator();
    for (const field of ['id', 'tenantId', 'name', 'enabled', 'severity', 'scope', 'condition']) {
        (0, node_test_1.it)(`detects missing ${field}`, () => {
            const rule = { ...validThresholdRule() };
            delete rule[field];
            const r = v.validate(rule);
            node_assert_1.strict.ok(!r.valid);
            node_assert_1.strict.ok(hasField(r, field), `Expected error on field "${field}"`);
            node_assert_1.strict.ok(hasCode(r, 'REQUIRED_FIELD_MISSING'));
        });
    }
    (0, node_test_1.it)('detects null field as missing', () => {
        const rule = { ...validThresholdRule(), id: null };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'id'));
    });
});
(0, node_test_1.describe)('RuleValidator — field type checks', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('rejects numeric id', () => {
        const r = v.validate({ ...validThresholdRule(), id: 123 });
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'INVALID_TYPE'));
        node_assert_1.strict.ok(hasField(r, 'id'));
    });
    (0, node_test_1.it)('rejects numeric tenantId', () => {
        const r = v.validate({ ...validThresholdRule(), tenantId: 999 });
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'tenantId'));
    });
    (0, node_test_1.it)('rejects non-string name', () => {
        const r = v.validate({ ...validThresholdRule(), name: 123 });
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'name'));
    });
    (0, node_test_1.it)('rejects empty name', () => {
        const r = v.validate({ ...validThresholdRule(), name: '   ' });
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'EMPTY_STRING'));
    });
    (0, node_test_1.it)('rejects non-boolean enabled', () => {
        const r = v.validate({ ...validThresholdRule(), enabled: 'yes' });
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'enabled'));
    });
    (0, node_test_1.it)('rejects invalid severity', () => {
        const r = v.validate({ ...validThresholdRule(), severity: 'EXTREME' });
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'severity'));
        node_assert_1.strict.ok(hasCode(r, 'INVALID_VALUE'));
    });
    (0, node_test_1.it)('rejects invalid scope', () => {
        const r = v.validate({ ...validThresholdRule(), scope: 'GLOBAL' });
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'scope'));
    });
    (0, node_test_1.it)('rejects non-object condition', () => {
        const r = v.validate({ ...validThresholdRule(), condition: 'bad' });
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'condition'));
    });
});
(0, node_test_1.describe)('RuleValidator — THRESHOLD condition validation', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('rejects missing metric', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', operator: 'GT', value: 5 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'condition.metric'));
    });
    (0, node_test_1.it)('rejects invalid metric name', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'invalid_metric', operator: 'GT', value: 5 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'INVALID_VALUE'));
    });
    (0, node_test_1.it)('rejects missing operator', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', value: 5 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'condition.operator'));
    });
    (0, node_test_1.it)('rejects invalid operator', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'BETWEEN', value: 5 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'INVALID_VALUE'));
    });
    (0, node_test_1.it)('rejects missing value', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'GT' },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'condition.value'));
    });
    (0, node_test_1.it)('rejects NaN value', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'GT', value: NaN },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
    });
    (0, node_test_1.it)('accepts all valid operators', () => {
        for (const op of ['GT', 'LT', 'GTE', 'LTE', 'EQ']) {
            const rule = {
                ...validThresholdRule(),
                condition: { type: 'THRESHOLD', metric: 'cpc', operator: op, value: 5 },
            };
            const r = v.validate(rule);
            node_assert_1.strict.ok(r.valid, `Operator ${op} should be valid but got: ${JSON.stringify(r.errors)}`);
        }
    });
    (0, node_test_1.it)('accepts all valid metrics', () => {
        const validMetrics = ['impressions', 'clicks', 'conversions', 'spend', 'revenue', 'ctr', 'cpc', 'cvr', 'roas'];
        for (const metric of validMetrics) {
            const rule = {
                ...validThresholdRule(),
                condition: { type: 'THRESHOLD', metric, operator: 'GT', value: 1 },
            };
            const r = v.validate(rule);
            node_assert_1.strict.ok(r.valid, `Metric ${metric} should be valid`);
        }
    });
});
(0, node_test_1.describe)('RuleValidator — DROP_PERCENT condition validation', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('rejects missing metric', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', thresholdPercent: 30 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'condition.metric'));
    });
    (0, node_test_1.it)('rejects missing thresholdPercent', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks' },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'condition.thresholdPercent'));
    });
    (0, node_test_1.it)('rejects thresholdPercent > 100', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: 150 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
    });
    (0, node_test_1.it)('rejects negative thresholdPercent', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: -10 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
    });
    (0, node_test_1.it)('accepts boundary value thresholdPercent = 100', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: 100 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(r.valid, JSON.stringify(r.errors));
    });
});
(0, node_test_1.describe)('RuleValidator — ZERO_CONVERSIONS condition validation', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('rejects missing minSpend', () => {
        const rule = {
            ...validZeroConvRule(),
            condition: { type: 'ZERO_CONVERSIONS' },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasField(r, 'condition.minSpend'));
    });
    (0, node_test_1.it)('rejects negative minSpend', () => {
        const rule = {
            ...validZeroConvRule(),
            condition: { type: 'ZERO_CONVERSIONS', minSpend: -50 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
    });
    (0, node_test_1.it)('accepts zero minSpend', () => {
        const rule = {
            ...validZeroConvRule(),
            condition: { type: 'ZERO_CONVERSIONS', minSpend: 0 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(r.valid, JSON.stringify(r.errors));
    });
});
(0, node_test_1.describe)('RuleValidator — unknown condition type', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('rejects unknown condition type', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'RATE_LIMIT', metric: 'cpc' },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'INVALID_VALUE'));
    });
    (0, node_test_1.it)('rejects condition without type', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { metric: 'cpc', operator: 'GT', value: 5 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'REQUIRED_FIELD_MISSING'));
    });
});
(0, node_test_1.describe)('RuleValidator — business rules', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('warns on negative threshold value', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'GT', value: -1 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'SUSPICIOUS_VALUE'));
    });
    (0, node_test_1.it)('warns on DROP_PERCENT threshold of 0', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: 0 },
        };
        const r = v.validate(rule);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(hasCode(r, 'SUSPICIOUS_VALUE'));
    });
});
(0, node_test_1.describe)('RuleValidator — validateMany', () => {
    const v = new rule_validator_1.RuleValidator();
    (0, node_test_1.it)('returns valid for all-good rules', () => {
        const r = v.validateMany([validThresholdRule(), validDropRule(), validZeroConvRule()]);
        node_assert_1.strict.ok(r.valid);
        node_assert_1.strict.strictEqual(r.errors.length, 0);
    });
    (0, node_test_1.it)('prefixes errors with array index', () => {
        const r = v.validateMany([validThresholdRule(), null, validDropRule()]);
        node_assert_1.strict.ok(!r.valid);
        const indexedError = r.errors.find((e) => e.field.startsWith('[1].'));
        node_assert_1.strict.ok(indexedError, 'Expected error indexed at [1]');
    });
    (0, node_test_1.it)('collects errors from multiple invalid rules', () => {
        const r = v.validateMany([null, 'bad', 42]);
        node_assert_1.strict.ok(!r.valid);
        node_assert_1.strict.ok(r.errors.length >= 3, `Expected ≥3 errors, got ${r.errors.length}`);
    });
});
(0, node_test_1.describe)('RuleValidator — singleton export', () => {
    (0, node_test_1.it)('ruleValidator is an instance of RuleValidator', () => {
        node_assert_1.strict.ok(rule_validator_1.ruleValidator instanceof rule_validator_1.RuleValidator);
    });
    (0, node_test_1.it)('singleton validates correctly', () => {
        const r = rule_validator_1.ruleValidator.validate(validThresholdRule());
        node_assert_1.strict.ok(r.valid);
    });
});
//# sourceMappingURL=rule-validator.test.js.map