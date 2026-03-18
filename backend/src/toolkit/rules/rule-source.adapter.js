"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleSourceAdapter = void 0;
exports.adaptRuleSource = adaptRuleSource;
class RuleSourceAdapter {
    constructor(source) {
        this.source = source;
    }
    async resolveRules(tenantId) {
        return this.source.loadRules(tenantId);
    }
}
exports.RuleSourceAdapter = RuleSourceAdapter;
function adaptRuleSource(source) {
    return new RuleSourceAdapter(source);
}
//# sourceMappingURL=rule-source.adapter.js.map