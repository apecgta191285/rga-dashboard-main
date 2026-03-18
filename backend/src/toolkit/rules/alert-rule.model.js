"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEVERITY_PRIORITY = void 0;
exports.createAlertRule = createAlertRule;
exports.compareSeverity = compareSeverity;
exports.isSeverityAtLeast = isSeverityAtLeast;
function createAlertRule(params) {
    return {
        id: params.id ?? generateRuleId(params.tenantId),
        tenantId: params.tenantId,
        name: params.name,
        description: params.description,
        enabled: params.enabled ?? true,
        severity: params.severity ?? 'MEDIUM',
        scope: params.scope ?? 'CAMPAIGN',
        condition: params.condition,
        metadata: params.metadata,
    };
}
function generateRuleId(tenantId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `rule-${tenantId}-${timestamp}-${random}`;
}
exports.SEVERITY_PRIORITY = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
};
function compareSeverity(a, b) {
    return exports.SEVERITY_PRIORITY[a] - exports.SEVERITY_PRIORITY[b];
}
function isSeverityAtLeast(severity, minimum) {
    return exports.SEVERITY_PRIORITY[severity] >= exports.SEVERITY_PRIORITY[minimum];
}
//# sourceMappingURL=alert-rule.model.js.map