"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformMapper = void 0;
const client_1 = require("@prisma/client");
const platform_types_1 = require("../domain/platform.types");
const contracts_1 = require("../core/contracts");
const platform_utils_1 = require("../domain/platform-utils");
class PlatformMapper {
    static toPersistence(domain) {
        const mapped = PlatformMapper.DOMAIN_TO_PERSISTENCE[domain];
        if (!mapped) {
            throw new platform_utils_1.UnsupportedPlatformError(domain, 'toPersistence');
        }
        return mapped;
    }
    static toDomain(raw) {
        const values = Object.values(platform_types_1.ToolkitPlatform);
        if (values.includes(raw)) {
            return contracts_1.Result.success(raw);
        }
        return contracts_1.Result.failure(new platform_utils_1.UnsupportedPlatformError(raw, 'toDomain'));
    }
}
exports.PlatformMapper = PlatformMapper;
PlatformMapper.DOMAIN_TO_PERSISTENCE = {
    [platform_types_1.ToolkitPlatform.GoogleAds]: client_1.AdPlatform.GOOGLE_ADS,
    [platform_types_1.ToolkitPlatform.Facebook]: client_1.AdPlatform.FACEBOOK,
    [platform_types_1.ToolkitPlatform.TikTok]: client_1.AdPlatform.TIKTOK,
    [platform_types_1.ToolkitPlatform.LineAds]: client_1.AdPlatform.LINE_ADS,
    [platform_types_1.ToolkitPlatform.Shopee]: client_1.AdPlatform.SHOPEE,
    [platform_types_1.ToolkitPlatform.Lazada]: client_1.AdPlatform.LAZADA,
    [platform_types_1.ToolkitPlatform.Instagram]: client_1.AdPlatform.INSTAGRAM,
    [platform_types_1.ToolkitPlatform.GoogleAnalytics]: client_1.AdPlatform.GOOGLE_ANALYTICS,
};
//# sourceMappingURL=platform.mapper.js.map