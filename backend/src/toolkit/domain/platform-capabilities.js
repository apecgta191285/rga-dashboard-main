"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIMULATABLE_PLATFORMS = exports.SEEDABLE_PLATFORMS = exports.PLATFORM_CAPABILITIES = void 0;
const platform_types_1 = require("./platform.types");
exports.PLATFORM_CAPABILITIES = {
    [platform_types_1.ToolkitPlatform.GoogleAds]: {
        label: 'Google Ads',
        icon: '🔍',
        isSeedable: true,
        isSimulatable: true
    },
    [platform_types_1.ToolkitPlatform.Facebook]: {
        label: 'Facebook',
        icon: '📘',
        isSeedable: true,
        isSimulatable: true
    },
    [platform_types_1.ToolkitPlatform.TikTok]: {
        label: 'TikTok',
        icon: '🎵',
        isSeedable: true,
        isSimulatable: true
    },
    [platform_types_1.ToolkitPlatform.LineAds]: {
        label: 'LINE Ads',
        icon: '💬',
        isSeedable: true,
        isSimulatable: true
    },
    [platform_types_1.ToolkitPlatform.Shopee]: {
        label: 'Shopee Ads',
        icon: '🛒',
        isSeedable: true,
        isSimulatable: true
    },
    [platform_types_1.ToolkitPlatform.Lazada]: {
        label: 'Lazada Ads',
        icon: '🛍️',
        isSeedable: true,
        isSimulatable: true
    },
    [platform_types_1.ToolkitPlatform.Instagram]: {
        label: 'Instagram Ads',
        icon: 'IG',
        isSeedable: false,
        isSimulatable: false
    },
    [platform_types_1.ToolkitPlatform.GoogleAnalytics]: {
        label: 'Google Analytics',
        icon: '📊',
        isSeedable: false,
        isSimulatable: false
    }
};
exports.SEEDABLE_PLATFORMS = platform_types_1.ALL_TOOLKIT_PLATFORMS.filter(p => exports.PLATFORM_CAPABILITIES[p].isSeedable);
exports.SIMULATABLE_PLATFORMS = platform_types_1.ALL_TOOLKIT_PLATFORMS.filter(p => exports.PLATFORM_CAPABILITIES[p].isSimulatable);
//# sourceMappingURL=platform-capabilities.js.map