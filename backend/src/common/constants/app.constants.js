"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.TOKEN_EXPIRY = exports.GOOGLE_ADS = exports.HEALTH_CHECK = exports.SYNC_DEFAULTS = exports.CACHE_TTL = void 0;
exports.CACHE_TTL = {
    TEN_MINUTES: 600000,
    THIRTY_MINUTES: 1800000,
    ONE_HOUR: 3600000,
    SIX_HOURS: 21600000,
};
exports.SYNC_DEFAULTS = {
    DAYS_TO_SYNC: 30,
    PAGE_SIZE: 1000,
};
exports.HEALTH_CHECK = {
    MEMORY_THRESHOLD_BYTES: 500 * 1024 * 1024,
};
exports.GOOGLE_ADS = {
    MICROS_TO_CURRENCY: 1000000,
};
exports.TOKEN_EXPIRY = {
    REFRESH_THRESHOLD_MS: 5 * 60 * 1000,
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};
//# sourceMappingURL=app.constants.js.map