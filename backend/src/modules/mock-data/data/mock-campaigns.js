"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_MOCK_CAMPAIGNS = exports.MOCK_LINE_ADS_CAMPAIGNS = exports.MOCK_TIKTOK_CAMPAIGNS = exports.MOCK_FACEBOOK_CAMPAIGNS = exports.MOCK_GOOGLE_ADS_CAMPAIGNS = void 0;
exports.getMockCampaignsByPlatform = getMockCampaignsByPlatform;
const client_1 = require("@prisma/client");
exports.MOCK_GOOGLE_ADS_CAMPAIGNS = [
    {
        externalId: 'gads-001',
        name: 'Google Search - Brand Keywords',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 50000,
        platform: client_1.AdPlatform.GOOGLE_ADS,
    },
    {
        externalId: 'gads-002',
        name: 'Google Search - Generic Keywords',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 80000,
        platform: client_1.AdPlatform.GOOGLE_ADS,
    },
    {
        externalId: 'gads-003',
        name: 'Display Remarketing',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 30000,
        platform: client_1.AdPlatform.GOOGLE_ADS,
    },
    {
        externalId: 'gads-004',
        name: 'Google Shopping',
        status: client_1.CampaignStatus.PAUSED,
        budget: 45000,
        platform: client_1.AdPlatform.GOOGLE_ADS,
    },
];
exports.MOCK_FACEBOOK_CAMPAIGNS = [
    {
        externalId: 'fb-001',
        name: 'Facebook Lead Gen - Form',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 35000,
        platform: client_1.AdPlatform.FACEBOOK,
    },
    {
        externalId: 'fb-002',
        name: 'Facebook Video Views',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 25000,
        platform: client_1.AdPlatform.FACEBOOK,
    },
    {
        externalId: 'fb-003',
        name: 'Facebook Conversions - Website',
        status: client_1.CampaignStatus.PAUSED,
        budget: 60000,
        platform: client_1.AdPlatform.FACEBOOK,
    },
];
exports.MOCK_TIKTOK_CAMPAIGNS = [
    {
        externalId: 'tiktok-001',
        name: 'TikTok Awareness - Reach',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 40000,
        platform: client_1.AdPlatform.TIKTOK,
    },
    {
        externalId: 'tiktok-002',
        name: 'TikTok Traffic - Website Visits',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 55000,
        platform: client_1.AdPlatform.TIKTOK,
    },
];
exports.MOCK_LINE_ADS_CAMPAIGNS = [
    {
        externalId: 'line-001',
        name: 'LINE Ads - Brand Awareness',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 50000,
        platform: client_1.AdPlatform.LINE_ADS,
    },
    {
        externalId: 'line-002',
        name: 'LINE Ads - Lead Generation',
        status: client_1.CampaignStatus.ACTIVE,
        budget: 75000,
        platform: client_1.AdPlatform.LINE_ADS,
    },
    {
        externalId: 'line-003',
        name: 'LINE Ads - Retargeting',
        status: client_1.CampaignStatus.PAUSED,
        budget: 30000,
        platform: client_1.AdPlatform.LINE_ADS,
    },
];
exports.ALL_MOCK_CAMPAIGNS = [
    ...exports.MOCK_GOOGLE_ADS_CAMPAIGNS,
    ...exports.MOCK_FACEBOOK_CAMPAIGNS,
    ...exports.MOCK_TIKTOK_CAMPAIGNS,
    ...exports.MOCK_LINE_ADS_CAMPAIGNS,
];
function getMockCampaignsByPlatform(platform) {
    switch (platform) {
        case 'GOOGLE_ADS':
            return exports.MOCK_GOOGLE_ADS_CAMPAIGNS;
        case 'FACEBOOK':
            return exports.MOCK_FACEBOOK_CAMPAIGNS;
        case 'TIKTOK':
            return exports.MOCK_TIKTOK_CAMPAIGNS;
        case 'LINE_ADS':
            return exports.MOCK_LINE_ADS_CAMPAIGNS;
        default:
            return [];
    }
}
//# sourceMappingURL=mock-campaigns.js.map