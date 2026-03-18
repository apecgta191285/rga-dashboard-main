"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManifestBuilder = void 0;
const crypto_1 = require("crypto");
const types_1 = require("./types");
const redactor_1 = require("./redactor");
class StepHandle {
    constructor(stepId, name, onClose) {
        this.stepId = stepId;
        this.name = name;
        this.onClose = onClose;
        this.startTime = Date.now();
        this.closed = false;
    }
    close(params) {
        if (this.closed)
            return;
        this.closed = true;
        const finishedAt = new Date();
        const durationMs = Date.now() - this.startTime;
        this.onClose({
            stepId: this.stepId,
            name: this.name,
            startedAt: new Date(this.startTime).toISOString(),
            finishedAt: finishedAt.toISOString(),
            durationMs,
            status: params.status,
            summary: (0, redactor_1.truncate)(params.summary, redactor_1.TRUNCATION_LIMITS.STEP_SUMMARY),
            metrics: params.metrics ?? null,
            error: params.error ?? null,
        });
    }
}
class ManifestBuilder {
    constructor(config) {
        this.status = 'BLOCKED';
        this.exitCode = 78;
        this.safety = null;
        this.tenant = {
            tenantId: 'UNRESOLVED',
            tenantSlug: null,
            tenantDisplayName: null,
            tenantResolution: 'NOT_ATTEMPTED',
        };
        this.steps = [];
        this.stepCounter = 0;
        this.results = {
            writesPlanned: null,
            writesApplied: null,
            externalCalls: null,
            filesystemWrites: null,
            warnings: [],
            errors: [],
        };
        this.finalized = false;
        this.runId = config.runId || (0, crypto_1.randomUUID)();
        this.startMs = Date.now();
        this.startedAt = new Date(this.startMs).toISOString();
        this.executionMode = config.executionMode;
        this.type = config.type;
        this.tty = !!(process.stdout && process.stdout.isTTY);
        this.runtime = {
            toolkitVersion: '2.0.0',
            nodeVersion: process.version,
            os: process.platform,
            pid: process.pid,
        };
        const defaultFlags = {
            dryRun: true,
            noDryRun: false,
            force: false,
            yes: false,
            verbose: false,
            manifestDir: null,
            seed: null,
            scenario: null,
        };
        const defaultConfirmation = {
            tierUsed: 'NONE',
            confirmationMethod: 'NONE',
            confirmed: false,
        };
        this.invocation = {
            commandName: config.commandName,
            commandClassification: config.commandClassification,
            args: (0, redactor_1.redactArgs)(config.args ?? {}),
            flags: { ...defaultFlags, ...config.flags },
            confirmation: defaultConfirmation,
        };
    }
    getRunId() {
        return this.runId;
    }
    setSafety(safety) {
        if (this.finalized)
            return;
        this.safety = safety;
    }
    setTenant(tenant) {
        if (this.finalized)
            return;
        this.tenant = tenant;
    }
    setConfirmation(confirmation) {
        if (this.finalized)
            return;
        this.invocation = {
            ...this.invocation,
            confirmation,
        };
    }
    setResults(results) {
        if (this.finalized)
            return;
        this.results = { ...this.results, ...results };
    }
    addWarning(warning) {
        if (this.finalized)
            return;
        if (this.results.warnings.length < redactor_1.TRUNCATION_LIMITS.MAX_WARNINGS) {
            this.results = {
                ...this.results,
                warnings: [
                    ...this.results.warnings,
                    (0, redactor_1.truncate)(warning, redactor_1.TRUNCATION_LIMITS.ERROR_MESSAGE),
                ],
            };
        }
    }
    addError(error) {
        if (this.finalized)
            return;
        if (this.results.errors.length < redactor_1.TRUNCATION_LIMITS.MAX_ERRORS) {
            this.results = {
                ...this.results,
                errors: [...this.results.errors, (0, redactor_1.sanitizeError)(error)],
            };
        }
    }
    startStep(name) {
        this.stepCounter++;
        const stepId = `step-${String(this.stepCounter).padStart(3, '0')}`;
        return new StepHandle(stepId, name, (step) => {
            if (!this.finalized) {
                this.steps.push(step);
            }
        });
    }
    finalize(status, exitCode) {
        if (this.finalized) {
            return this.buildDocument(this.status, this.exitCode);
        }
        this.finalized = true;
        this.status = status;
        this.exitCode = exitCode;
        return this.buildDocument(status, exitCode);
    }
    emergencyFinalize() {
        if (this.finalized) {
            return this.buildDocument(this.status, this.exitCode);
        }
        this.finalized = true;
        return this.buildDocument(this.status, this.exitCode);
    }
    isFinalized() {
        return this.finalized;
    }
    buildDocument(status, exitCode) {
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - this.startMs;
        const warningsResult = (0, redactor_1.limitArray)(this.results.warnings, redactor_1.TRUNCATION_LIMITS.MAX_WARNINGS, 'warnings');
        const errorsResult = (0, redactor_1.limitArray)(this.results.errors, redactor_1.TRUNCATION_LIMITS.MAX_ERRORS, 'errors');
        const truncatedWarnings = warningsResult.items;
        if (warningsResult.truncatedWarning) {
            truncatedWarnings.push(warningsResult.truncatedWarning);
        }
        const safetySummary = this.safety ?? {
            policyVersion: '1.0.0',
            gates: [],
            envSummary: { toolkitEnv: null, classification: 'MISSING' },
            dbSafetySummary: {
                dbHostMasked: 'UNKNOWN',
                dbNameMasked: 'UNKNOWN',
                classification: 'UNKNOWN',
                matchedRule: null,
            },
        };
        const doc = {
            schemaVersion: types_1.MANIFEST_SCHEMA_VERSION,
            runId: this.runId,
            startedAt: this.startedAt,
            finishedAt: finishedAt.toISOString(),
            durationMs,
            status,
            exitCode,
            executionMode: this.executionMode,
            type: this.type,
            tty: this.tty,
            runtime: this.runtime,
            invocation: this.invocation,
            safety: safetySummary,
            tenant: this.tenant,
            steps: this.steps,
            results: {
                ...this.results,
                warnings: truncatedWarnings,
                errors: errorsResult.items,
            },
        };
        return doc;
    }
}
exports.ManifestBuilder = ManifestBuilder;
//# sourceMappingURL=manifest-builder.js.map