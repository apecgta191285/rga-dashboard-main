"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const redactor_1 = require("../redactor");
(0, node_test_1.describe)('isForbiddenKey', () => {
    (0, node_test_1.it)('blocks SECRET variants', () => {
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('JWT_SECRET'));
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('MY_SECRET_VAR'));
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('secret'));
    });
    (0, node_test_1.it)('blocks PASSWORD variants', () => {
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('DB_PASSWORD'));
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('password'));
    });
    (0, node_test_1.it)('blocks TOKEN variants', () => {
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('REFRESH_TOKEN'));
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('token'));
    });
    (0, node_test_1.it)('blocks KEY variants (word-boundary)', () => {
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('API_KEY'));
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('KEY_ID'));
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('PRIVATE_KEY'));
    });
    (0, node_test_1.it)('blocks COOKIE / AUTHORIZATION', () => {
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('SESSION_COOKIE'));
        node_assert_1.strict.ok((0, redactor_1.isForbiddenKey)('AUTHORIZATION'));
    });
    (0, node_test_1.it)('allows safe keys', () => {
        node_assert_1.strict.ok(!(0, redactor_1.isForbiddenKey)('TOOLKIT_ENV'));
        node_assert_1.strict.ok(!(0, redactor_1.isForbiddenKey)('NODE_ENV'));
        node_assert_1.strict.ok(!(0, redactor_1.isForbiddenKey)('PATH'));
        node_assert_1.strict.ok(!(0, redactor_1.isForbiddenKey)('HOME'));
        node_assert_1.strict.ok(!(0, redactor_1.isForbiddenKey)('MONKEY'));
    });
});
(0, node_test_1.describe)('isSafeKey', () => {
    (0, node_test_1.it)('allows TOOLKIT_ prefixed keys', () => {
        node_assert_1.strict.ok((0, redactor_1.isSafeKey)('TOOLKIT_ENV'));
        node_assert_1.strict.ok((0, redactor_1.isSafeKey)('TOOLKIT_SAFE_DB_HOSTS'));
    });
    (0, node_test_1.it)('allows curated keys', () => {
        node_assert_1.strict.ok((0, redactor_1.isSafeKey)('NODE_ENV'));
        node_assert_1.strict.ok((0, redactor_1.isSafeKey)('LOG_LEVEL'));
    });
    (0, node_test_1.it)('rejects DATABASE_URL (it is masked, not safe-listed)', () => {
        node_assert_1.strict.ok(!(0, redactor_1.isSafeKey)('DATABASE_URL'));
    });
    (0, node_test_1.it)('rejects unknown keys', () => {
        node_assert_1.strict.ok(!(0, redactor_1.isSafeKey)('RANDOM_VAR_12345'));
    });
});
(0, node_test_1.describe)('maskDatabaseUrl', () => {
    (0, node_test_1.it)('strips credentials from postgres URL', () => {
        node_assert_1.strict.strictEqual((0, redactor_1.maskDatabaseUrl)('postgresql://admin:s3cret@prod-db.acme.com:5432/rga_prod'), 'postgresql://***:***@prod-db.acme.com/rga_prod');
    });
    (0, node_test_1.it)('handles URL without credentials', () => {
        const result = (0, redactor_1.maskDatabaseUrl)('postgresql://host/db');
        node_assert_1.strict.ok(result.includes('host'));
    });
    (0, node_test_1.it)('returns [UNPARSEABLE_URL] for invalid URLs', () => {
        node_assert_1.strict.strictEqual((0, redactor_1.maskDatabaseUrl)('not-a-url'), '[UNPARSEABLE_URL]');
    });
});
(0, node_test_1.describe)('redactEnvEntry', () => {
    (0, node_test_1.it)('returns null for forbidden keys', () => {
        node_assert_1.strict.strictEqual((0, redactor_1.redactEnvEntry)('JWT_SECRET', 'abc'), null);
        node_assert_1.strict.strictEqual((0, redactor_1.redactEnvEntry)('DB_PASSWORD', 'pass'), null);
    });
    (0, node_test_1.it)('passes through safe keys', () => {
        node_assert_1.strict.deepStrictEqual((0, redactor_1.redactEnvEntry)('TOOLKIT_ENV', 'LOCAL'), { key: 'TOOLKIT_ENV', value: 'LOCAL' });
    });
    (0, node_test_1.it)('masks DATABASE_URL value', () => {
        const result = (0, redactor_1.redactEnvEntry)('DATABASE_URL', 'postgresql://user:pass@host/db');
        node_assert_1.strict.ok(result !== null);
        node_assert_1.strict.ok(!result.value.includes('pass'));
    });
    (0, node_test_1.it)('redacts unknown keys', () => {
        const result = (0, redactor_1.redactEnvEntry)('RANDOM_VAR', 'some-value');
        node_assert_1.strict.ok(result !== null);
        node_assert_1.strict.strictEqual(result.value, '[REDACTED]');
    });
});
(0, node_test_1.describe)('redactArgs', () => {
    (0, node_test_1.it)('redacts keys matching forbidden patterns', () => {
        const result = (0, redactor_1.redactArgs)({ API_KEY: 'secret', tenantId: 'visible' });
        node_assert_1.strict.strictEqual(result.API_KEY, '[REDACTED]');
        node_assert_1.strict.strictEqual(result.tenantId, 'visible');
    });
    (0, node_test_1.it)('handles empty args', () => {
        node_assert_1.strict.deepStrictEqual((0, redactor_1.redactArgs)({}), {});
    });
    (0, node_test_1.it)('handles empty record', () => {
        node_assert_1.strict.deepStrictEqual((0, redactor_1.redactArgs)({}), {});
    });
});
(0, node_test_1.describe)('redactEnv', () => {
    (0, node_test_1.it)('filters out forbidden keys entirely', () => {
        const result = (0, redactor_1.redactEnv)({
            TOOLKIT_ENV: 'LOCAL',
            JWT_SECRET: 'top-secret',
            NODE_ENV: 'development',
        });
        node_assert_1.strict.ok(result.TOOLKIT_ENV);
        node_assert_1.strict.strictEqual(result.JWT_SECRET, undefined);
        node_assert_1.strict.ok(result.NODE_ENV);
    });
});
(0, node_test_1.describe)('truncate', () => {
    (0, node_test_1.it)('returns short strings unchanged', () => {
        node_assert_1.strict.strictEqual((0, redactor_1.truncate)('hello', 100), 'hello');
    });
    (0, node_test_1.it)('truncates long strings with ellipsis', () => {
        const result = (0, redactor_1.truncate)('x'.repeat(300), 200);
        node_assert_1.strict.strictEqual(result.length, 200);
        node_assert_1.strict.ok(result.endsWith('…'));
    });
    (0, node_test_1.it)('handles empty string', () => {
        node_assert_1.strict.strictEqual((0, redactor_1.truncate)('', 100), '');
    });
});
(0, node_test_1.describe)('sanitizeError', () => {
    (0, node_test_1.it)('wraps Error objects', () => {
        const result = (0, redactor_1.sanitizeError)(new Error('test'));
        node_assert_1.strict.strictEqual(result.code, 'UNKNOWN_ERROR');
        node_assert_1.strict.strictEqual(result.message, 'test');
    });
    (0, node_test_1.it)('wraps non-Error values', () => {
        const result = (0, redactor_1.sanitizeError)('string-error');
        node_assert_1.strict.strictEqual(result.message, 'string-error');
    });
    (0, node_test_1.it)('handles null/undefined', () => {
        const result = (0, redactor_1.sanitizeError)(null);
        node_assert_1.strict.ok(result.message);
    });
});
(0, node_test_1.describe)('limitArray', () => {
    (0, node_test_1.it)('returns arrays within limit unchanged', () => {
        const result = (0, redactor_1.limitArray)([1, 2, 3], 5, 'items');
        node_assert_1.strict.deepStrictEqual(result.items, [1, 2, 3]);
        node_assert_1.strict.strictEqual(result.truncatedWarning, null);
    });
    (0, node_test_1.it)('truncates arrays exceeding limit', () => {
        const arr = Array.from({ length: 20 }, (_, i) => i);
        const result = (0, redactor_1.limitArray)(arr, 5, 'items');
        node_assert_1.strict.strictEqual(result.items.length, 5);
        node_assert_1.strict.ok(result.truncatedWarning !== null);
    });
});
//# sourceMappingURL=redactor.test.js.map