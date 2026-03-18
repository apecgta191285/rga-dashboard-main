"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateScenarioSpec = validateScenarioSpec;
const VALID_TRENDS = new Set(['STABLE', 'GROWTH', 'DECLINE', 'SPIKE']);
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
function validateScenarioSpec(raw, scenarioId) {
    const errors = [];
    const spec = raw;
    if (!spec.schemaVersion) {
        errors.push({
            field: 'schemaVersion',
            code: 'MISSING_SCHEMA_VERSION',
            message: 'Field "schemaVersion" is required (must be "1.0.0")',
            isRecoverable: true
        });
    }
    else if (spec.schemaVersion !== '1.0.0') {
        errors.push({
            field: 'schemaVersion',
            code: 'UNSUPPORTED_SCHEMA_VERSION',
            message: `Unsupported schemaVersion "${spec.schemaVersion}". Expected "1.0.0"`,
            isRecoverable: true
        });
    }
    if (!spec.name) {
        errors.push({
            field: 'name',
            code: 'MISSING_NAME',
            message: 'Field "name" is required',
            isRecoverable: true
        });
    }
    if (!spec.trend) {
        errors.push({
            field: 'trend',
            code: 'MISSING_TREND',
            message: 'Field "trend" is required',
            isRecoverable: true
        });
    }
    else if (!VALID_TRENDS.has(spec.trend)) {
        errors.push({
            field: 'trend',
            code: 'INVALID_TREND',
            message: `Invalid trend "${spec.trend}". Allowed: ${Array.from(VALID_TRENDS).join(', ')}`,
            isRecoverable: true
        });
    }
    if (spec.baseImpressions !== undefined) {
        if (typeof spec.baseImpressions !== 'number' || spec.baseImpressions <= 0 || spec.baseImpressions > 1_000_000) {
            errors.push({
                field: 'baseImpressions',
                code: 'INVALID_BASE_IMPRESSIONS',
                message: 'baseImpressions must be a number between 1 and 1,000,000',
                isRecoverable: true
            });
        }
    }
    if (spec.days !== undefined) {
        if (typeof spec.days !== 'number' || spec.days <= 0 || spec.days > 365) {
            errors.push({
                field: 'days',
                code: 'INVALID_DAYS',
                message: 'days must be a number between 1 and 365',
                isRecoverable: true
            });
        }
    }
    if (spec.dateAnchor !== undefined) {
        if (typeof spec.dateAnchor !== 'string' || !ISO_DATE_REGEX.test(spec.dateAnchor)) {
            errors.push({
                field: 'dateAnchor',
                code: 'INVALID_DATE_ANCHOR',
                message: 'dateAnchor must be a valid ISO 8601 UTC string (e.g. 2025-01-01T00:00:00Z)',
                isRecoverable: true
            });
        }
    }
    if (spec.aliases !== undefined) {
        if (!Array.isArray(spec.aliases) || !spec.aliases.every(a => typeof a === 'string')) {
            errors.push({
                field: 'aliases',
                code: 'INVALID_ALIASES',
                message: 'aliases must be an array of strings',
                isRecoverable: true
            });
        }
    }
    if (errors.length === 0) {
    }
    return {
        valid: errors.length === 0,
        errors,
        scenarioId
    };
}
//# sourceMappingURL=scenario-validator.js.map