"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_ALIASES = exports.SIMULATABLE_PLATFORMS = exports.PLATFORM_CONFIGS = void 0;
exports.getPlatformConfig = getPlatformConfig;
exports.getPlatformIcon = getPlatformIcon;
const platform_types_1 = require("./domain/platform.types");
const platform_utils_1 = require("./domain/platform-utils");
exports.PLATFORM_CONFIGS = {
    [platform_types_1.ToolkitPlatform.GoogleAds]: {
        platform: platform_types_1.ToolkitPlatform.GoogleAds,
        label: 'Google Ads',
        ctrRange: [0.015, 0.045],
        cpcRange: [0.5, 3.5],
        cvrRange: [0.02, 0.08],
        aovRange: [50, 200],
        impressionMultiplier: 1.0,
        weekendFactor: 0.7,
        distributionProfile: 'EVEN',
    },
    [platform_types_1.ToolkitPlatform.Facebook]: {
        platform: platform_types_1.ToolkitPlatform.Facebook,
        label: 'Facebook',
        ctrRange: [0.008, 0.025],
        cpcRange: [0.3, 2.0],
        cvrRange: [0.015, 0.06],
        aovRange: [40, 150],
        impressionMultiplier: 2.5,
        weekendFactor: 1.2,
        distributionProfile: 'PEAK_EVENING',
    },
    [platform_types_1.ToolkitPlatform.TikTok]: {
        platform: platform_types_1.ToolkitPlatform.TikTok,
        label: 'TikTok',
        ctrRange: [0.005, 0.03],
        cpcRange: [0.2, 1.5],
        cvrRange: [0.01, 0.04],
        aovRange: [30, 100],
        impressionMultiplier: 3.0,
        weekendFactor: 1.3,
        distributionProfile: 'PEAK_EVENING',
    },
    [platform_types_1.ToolkitPlatform.LineAds]: {
        platform: platform_types_1.ToolkitPlatform.LineAds,
        label: 'LINE Ads',
        ctrRange: [0.01, 0.03],
        cpcRange: [1.0, 5.0],
        cvrRange: [0.03, 0.10],
        aovRange: [100, 500],
        impressionMultiplier: 0.8,
        weekendFactor: 0.9,
        distributionProfile: 'PEAK_MORNING',
    },
    [platform_types_1.ToolkitPlatform.Shopee]: {
        platform: platform_types_1.ToolkitPlatform.Shopee,
        label: 'Shopee Ads',
        ctrRange: [0.02, 0.06],
        cpcRange: [0.5, 3.0],
        cvrRange: [0.05, 0.15],
        aovRange: [50, 300],
        impressionMultiplier: 1.2,
        weekendFactor: 1.5,
        distributionProfile: 'PEAK_EVENING'
    },
    [platform_types_1.ToolkitPlatform.Lazada]: {
        platform: platform_types_1.ToolkitPlatform.Lazada,
        label: 'Lazada Ads',
        ctrRange: [0.02, 0.05],
        cpcRange: [0.5, 2.5],
        cvrRange: [0.04, 0.12],
        aovRange: [50, 250],
        impressionMultiplier: 1.1,
        weekendFactor: 1.4,
        distributionProfile: 'PEAK_EVENING'
    },
};
function getPlatformConfig(platform) {
    if (!platform) {
        return exports.PLATFORM_CONFIGS[platform_types_1.ToolkitPlatform.GoogleAds];
    }
    return exports.PLATFORM_CONFIGS[platform] || exports.PLATFORM_CONFIGS[platform_types_1.ToolkitPlatform.GoogleAds];
}
exports.SIMULATABLE_PLATFORMS = [
    platform_types_1.ToolkitPlatform.GoogleAds,
    platform_types_1.ToolkitPlatform.Facebook,
    platform_types_1.ToolkitPlatform.TikTok,
    platform_types_1.ToolkitPlatform.LineAds,
    platform_types_1.ToolkitPlatform.Shopee,
    platform_types_1.ToolkitPlatform.Lazada,
];
exports.PLATFORM_ALIASES = platform_utils_1.PLATFORM_ALIASES;
function getPlatformIcon(platform) {
    const icons = {
        [platform_types_1.ToolkitPlatform.GoogleAds]: '๐”',
        [platform_types_1.ToolkitPlatform.Facebook]: '๐“',
        [platform_types_1.ToolkitPlatform.TikTok]: '๐ต',
        [platform_types_1.ToolkitPlatform.LineAds]: '๐’ฌ',
        [platform_types_1.ToolkitPlatform.Shopee]: '๐’',
        [platform_types_1.ToolkitPlatform.Lazada]: '๐๏ธ',
        [platform_types_1.ToolkitPlatform.Instagram]: 'IG',
        [platform_types_1.ToolkitPlatform.GoogleAnalytics]: '๐“',
    };
    return icons[platform] || '๐“';
}
//# sourceMappingURL=platform-configs.js.map