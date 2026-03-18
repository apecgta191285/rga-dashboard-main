"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedPlatformError = exports.PLATFORM_ALIASES = void 0;
exports.normalizePlatformInput = normalizePlatformInput;
const platform_types_1 = require("./platform.types");
const contracts_1 = require("../core/contracts");
const contracts_2 = require("../core/contracts");
exports.PLATFORM_ALIASES = {
    'google': platform_types_1.ToolkitPlatform.GoogleAds,
    'google_ads': platform_types_1.ToolkitPlatform.GoogleAds,
    'facebook': platform_types_1.ToolkitPlatform.Facebook,
    'meta': platform_types_1.ToolkitPlatform.Facebook,
    'tiktok': platform_types_1.ToolkitPlatform.TikTok,
    'line': platform_types_1.ToolkitPlatform.LineAds,
    'line_ads': platform_types_1.ToolkitPlatform.LineAds,
    'shopee': platform_types_1.ToolkitPlatform.Shopee,
    'lazada': platform_types_1.ToolkitPlatform.Lazada,
    'instagram': platform_types_1.ToolkitPlatform.Instagram,
    'ig': platform_types_1.ToolkitPlatform.Instagram,
};
class UnsupportedPlatformError extends contracts_2.ToolkitError {
    constructor(value, context) {
        super(`Unsupported platform '${value}' in context '${context}'`);
        this.value = value;
        this.context = context;
        this.code = 'UNSUPPORTED_PLATFORM';
        this.isRecoverable = false;
    }
}
exports.UnsupportedPlatformError = UnsupportedPlatformError;
function normalizePlatformInput(input) {
    const normalized = input.toLowerCase().trim();
    if (exports.PLATFORM_ALIASES[normalized]) {
        return contracts_1.Result.success(exports.PLATFORM_ALIASES[normalized]);
    }
    const canonical = Object.values(platform_types_1.ToolkitPlatform).find(p => p.toLowerCase() === normalized);
    if (canonical) {
        return contracts_1.Result.success(canonical);
    }
    return contracts_1.Result.failure(new UnsupportedPlatformError(input, 'normalizePlatformInput'));
}
//# sourceMappingURL=platform-utils.js.map