"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRUNCATION_LIMITS = void 0;
exports.isForbiddenKey = isForbiddenKey;
exports.isSafeKey = isSafeKey;
exports.maskDatabaseUrl = maskDatabaseUrl;
exports.redactEnvEntry = redactEnvEntry;
exports.redactArgs = redactArgs;
exports.truncate = truncate;
exports.scrubMessage = scrubMessage;
exports.sanitizeError = sanitizeError;
exports.redactEnv = redactEnv;
exports.limitArray = limitArray;
const SAFE_ENV_KEYS = new Set([
    'TOOLKIT_ENV',
    'NODE_ENV',
    'LOG_LEVEL',
    'LOG_FORMAT',
    'ENABLE_DRY_RUN',
    'CONFIRM_DESTRUCTIVE',
    'TOOLKIT_SAFE_DB_HOSTS',
]);
const MASKED_KEYS = new Set([
    'DATABASE_URL',
]);
const TRANSPARENT_KEYS = new Set([
    'API_BASE_URL',
]);
const FORBIDDEN_PATTERNS = [
    /SECRET/i,
    /PASSWORD/i,
    /TOKEN/i,
    /(?:^|_)KEY(?:$|_)/i,
    /COOKIE/i,
    /^AUTHORIZATION$/i,
];
const REDACTED_PLACEHOLDER = '[REDACTED]';
exports.TRUNCATION_LIMITS = {
    STEP_SUMMARY: 200,
    ERROR_MESSAGE: 500,
    ARG_VALUE: 1000,
    MAX_WARNINGS: 50,
    MAX_ERRORS: 10,
    MAX_MANIFEST_BYTES: 256 * 1024,
};
function isForbiddenKey(key) {
    return FORBIDDEN_PATTERNS.some(pattern => pattern.test(key));
}
function isSafeKey(key) {
    return SAFE_ENV_KEYS.has(key);
}
function maskDatabaseUrl(url) {
    try {
        const parsed = new URL(url);
        const dbName = parsed.pathname.replace(/^\//, '');
        return `postgresql://***:***@${parsed.hostname}/${dbName}`;
    }
    catch {
        return '[UNPARSEABLE_URL]';
    }
}
function redactEnvEntry(key, value) {
    if (isForbiddenKey(key)) {
        return null;
    }
    if (SAFE_ENV_KEYS.has(key)) {
        return { key, value };
    }
    if (MASKED_KEYS.has(key)) {
        return { key, value: maskDatabaseUrl(value) };
    }
    if (TRANSPARENT_KEYS.has(key)) {
        return { key, value };
    }
    return { key, value: REDACTED_PLACEHOLDER };
}
function redactArgs(args) {
    const result = {};
    for (const [key, value] of Object.entries(args)) {
        if (isForbiddenKey(key)) {
            result[key] = REDACTED_PLACEHOLDER;
        }
        else if (typeof value === 'string') {
            result[key] = truncate(value, exports.TRUNCATION_LIMITS.ARG_VALUE);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
function truncate(value, maxLength) {
    if (value.length <= maxLength) {
        return value;
    }
    return value.slice(0, maxLength - 1) + '…';
}
function scrubMessage(value) {
    return value.replace(/postgres:\/\/([^:@\s]+):([^@\s]+)@/g, 'postgres://***:***@');
}
function sanitizeError(error) {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        const err = error;
        return {
            code: String(err.code),
            message: truncate(scrubMessage(String(err.message)), exports.TRUNCATION_LIMITS.ERROR_MESSAGE),
            isRecoverable: typeof err.isRecoverable === 'boolean' ? err.isRecoverable : false,
        };
    }
    if (error instanceof Error) {
        return {
            code: 'UNKNOWN_ERROR',
            message: truncate(scrubMessage(error.message), exports.TRUNCATION_LIMITS.ERROR_MESSAGE),
            isRecoverable: false,
        };
    }
    return {
        code: 'UNKNOWN_ERROR',
        message: truncate(scrubMessage(String(error)), exports.TRUNCATION_LIMITS.ERROR_MESSAGE),
        isRecoverable: false,
    };
}
function redactEnv(env) {
    const result = {};
    for (const [key, value] of Object.entries(env)) {
        if (value === undefined)
            continue;
        const entry = redactEnvEntry(key, value);
        if (entry) {
            result[entry.key] = entry.value;
        }
    }
    return result;
}
function limitArray(arr, max, warningPrefix) {
    if (arr.length <= max) {
        return { items: arr, truncatedWarning: null };
    }
    const remaining = arr.length - max;
    return {
        items: arr.slice(0, max),
        truncatedWarning: `+${remaining} more ${warningPrefix} truncated`,
    };
}
//# sourceMappingURL=redactor.js.map