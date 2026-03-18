"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationError = void 0;
exports.loadConfiguration = loadConfiguration;
const zod_1 = require("zod");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const contracts_1 = require("./contracts");
(0, dotenv_1.config)({ path: (0, path_1.resolve)(process.cwd(), '.env') });
const ConfigurationSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production'])
        .default('development'),
    DATABASE_URL: zod_1.z.string()
        .min(1, 'DATABASE_URL is required')
        .refine(url => url.startsWith('postgresql://'), 'DATABASE_URL must be a PostgreSQL connection string'),
    DATABASE_TIMEOUT: zod_1.z.string()
        .transform(Number)
        .default('5000')
        .refine(n => n > 0, 'Timeout must be positive'),
    DATABASE_MAX_RETRIES: zod_1.z.string()
        .transform(Number)
        .default('3')
        .refine(n => n >= 0, 'Max retries must be non-negative'),
    API_BASE_URL: zod_1.z.string()
        .url()
        .default('http://localhost:3000'),
    API_TIMEOUT: zod_1.z.string()
        .transform(Number)
        .default('30000'),
    API_RETRY_ATTEMPTS: zod_1.z.string()
        .transform(Number)
        .default('3'),
    API_RETRY_DELAY: zod_1.z.string()
        .transform(Number)
        .default('1000'),
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error'])
        .default('info'),
    LOG_FORMAT: zod_1.z.enum(['json', 'pretty'])
        .default('pretty'),
    ENABLE_DRY_RUN: zod_1.z.string()
        .transform(v => v === 'true')
        .default('true'),
    CONFIRM_DESTRUCTIVE: zod_1.z.string()
        .transform(v => v !== 'false')
        .default('true'),
    MAX_CONCURRENT_COMMANDS: zod_1.z.string()
        .transform(Number)
        .default('5'),
});
function loadConfiguration() {
    const parsed = ConfigurationSchema.safeParse(process.env);
    if (!parsed.success) {
        const formatted = parsed.error.errors
            .map(e => `  - ${e.path.join('.')}: ${e.message}`)
            .join('\n');
        throw new ConfigurationError(`Invalid configuration:\n${formatted}\n\n` +
            `Please check your .env file and ensure all required variables are set.`);
    }
    const env = parsed.data;
    return Object.freeze({
        environment: env.NODE_ENV,
        database: {
            url: env.DATABASE_URL,
            timeoutMs: env.DATABASE_TIMEOUT,
            maxRetries: env.DATABASE_MAX_RETRIES,
        },
        api: {
            baseUrl: env.API_BASE_URL,
            timeoutMs: env.API_TIMEOUT,
            retryAttempts: env.API_RETRY_ATTEMPTS,
            retryDelayMs: env.API_RETRY_DELAY,
        },
        logging: {
            level: env.LOG_LEVEL,
            format: env.LOG_FORMAT,
        },
        features: {
            enableDryRun: env.ENABLE_DRY_RUN,
            confirmDestructiveActions: env.CONFIRM_DESTRUCTIVE,
            maxConcurrentCommands: env.MAX_CONCURRENT_COMMANDS,
        },
    });
}
class ConfigurationError extends contracts_1.ToolkitError {
    constructor(message) {
        super(message);
        this.code = 'CONFIGURATION_ERROR';
        this.isRecoverable = false;
    }
}
exports.ConfigurationError = ConfigurationError;
//# sourceMappingURL=configuration.js.map