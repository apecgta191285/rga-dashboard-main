"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VerificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const verification_repository_1 = require("./verification.repository");
const scenario_loader_1 = require("../../toolkit/scenarios/scenario-loader");
const alert_rule_evaluator_1 = require("./rules/alert-rule.evaluator");
const rule_catalog_1 = require("./rules/rule-catalog");
const constants_1 = require("../../toolkit/core/constants");
let VerificationService = VerificationService_1 = class VerificationService {
    constructor(repository, scenarioLoader, ruleEvaluator) {
        this.repository = repository;
        this.scenarioLoader = scenarioLoader;
        this.ruleEvaluator = ruleEvaluator;
        this.logger = new common_1.Logger(VerificationService_1.name);
    }
    async verifyScenario(options) {
        const startTime = Date.now();
        this.logger.log(`Starting verification for scenario: ${options.scenarioId}, tenant: ${options.tenantId}`);
        let spec;
        try {
            spec = await this.scenarioLoader.load(options.scenarioId);
        }
        catch (e) {
            this.logger.error(`Failed to load scenario: ${e.message}`);
            throw new common_1.NotFoundException(`Scenario ${options.scenarioId} not found or invalid: ${e.message}`);
        }
        const days = spec.days || 30;
        const anchor = spec.dateAnchor ? new Date(spec.dateAnchor) : new Date(constants_1.DETERMINISTIC_ANCHOR);
        const windowStart = new Date(anchor);
        windowStart.setDate(windowStart.getDate() - days);
        const windowEnd = anchor;
        this.logger.log(`Date Window: ${windowStart.toISOString()} - ${windowEnd.toISOString()}`);
        const checks = [];
        const driftCount = await this.repository.countDriftMetrics(options.tenantId, windowStart, windowEnd);
        if (driftCount > 0) {
            checks.push({
                ruleId: 'INT-003',
                name: 'DATE_WINDOW_MATCH',
                status: 'FAIL',
                severity: 'FAIL',
                message: `Found ${driftCount} metrics outside window`,
                details: { driftCount, windowStart, windowEnd }
            });
        }
        else {
            checks.push({
                ruleId: 'INT-003',
                name: 'DATE_WINDOW_MATCH',
                status: 'PASS',
                severity: 'FAIL',
                message: 'All data within window',
            });
        }
        const consistencyErrors = await this.repository.checkMockFlagConsistency(options.tenantId);
        if (consistencyErrors > 0) {
            checks.push({
                ruleId: 'INT-004',
                name: 'MOCK_FLAG_CONSISTENCY',
                status: 'FAIL',
                severity: 'FAIL',
                message: `Found ${consistencyErrors} records with toolkit source but isMockData=false`,
                details: { count: consistencyErrors }
            });
        }
        else {
            checks.push({
                ruleId: 'INT-004',
                name: 'MOCK_FLAG_CONSISTENCY',
                status: 'PASS',
                severity: 'FAIL',
                message: 'All toolkit records have isMockData=true',
            });
        }
        const count = await this.repository.countMetrics(options.tenantId, windowStart, windowEnd);
        if (count === 0) {
            checks.push({
                ruleId: 'INT-001',
                name: 'ROW_COUNT_MATCH',
                status: 'FAIL',
                severity: 'FAIL',
                message: 'No metrics found for scenario',
                details: { count, expected: '>0' }
            });
        }
        else {
            checks.push({
                ruleId: 'INT-001',
                name: 'ROW_COUNT_MATCH',
                status: 'PASS',
                severity: 'FAIL',
                message: `Found ${count} metrics`,
                details: { count }
            });
        }
        try {
            const aggregates = await this.repository.getAggregates(options.tenantId, windowStart, windowEnd);
            for (const agg of aggregates) {
                const bizChecks = this.ruleEvaluator.evaluate(agg, rule_catalog_1.BIZ_RULES);
                checks.push(...bizChecks);
                const anomalyChecks = this.ruleEvaluator.evaluate(agg, rule_catalog_1.ANOMALY_RULES);
                checks.push(...anomalyChecks);
            }
            if (aggregates.length === 0 && count > 0) {
                this.logger.warn('Metrics found but aggregates returned empty?');
            }
        }
        catch (e) {
            this.logger.error(`Rule Evaluation Failed: ${e.message}`, e.stack);
            checks.push({
                ruleId: 'SYS-ERR',
                name: 'RULE_EVAL_ERROR',
                status: 'FAIL',
                severity: 'FAIL',
                message: `Rule evaluation crashed: ${e.message}`
            });
        }
        const passed = checks.filter(c => c.status === 'PASS').length;
        const failed = checks.filter(c => c.status === 'FAIL').length;
        const warnings = checks.filter(c => c.status === 'WARN').length;
        const status = failed > 0 ? 'FAIL' : (warnings > 0 ? 'WARN' : 'PASS');
        const durationMs = Date.now() - startTime;
        return {
            meta: {
                version: '1.0.0',
                generator: 'rga-toolkit-verify',
                createdAt: new Date().toISOString(),
                runId: options.runId || 'unknown',
                scenarioId: options.scenarioId,
                tenantId: options.tenantId,
            },
            summary: {
                status,
                totalChecks: checks.length,
                passed,
                failed,
                warnings,
                durationMs,
            },
            results: checks,
            provenance: {
                isMockData: true,
                sourcePrefix: 'toolkit:'
            }
        };
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = VerificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [verification_repository_1.VerificationRepository,
        scenario_loader_1.ScenarioLoader,
        alert_rule_evaluator_1.AlertRuleEvaluator])
], VerificationService);
//# sourceMappingURL=verification.service.js.map