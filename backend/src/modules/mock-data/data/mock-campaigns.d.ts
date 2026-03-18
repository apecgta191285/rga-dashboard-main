import { CampaignStatus, AdPlatform } from '@prisma/client';
export interface MockCampaign {
    externalId: string;
    name: string;
    status: CampaignStatus;
    budget: number;
    platform: AdPlatform;
}
export declare const MOCK_GOOGLE_ADS_CAMPAIGNS: MockCampaign[];
export declare const MOCK_FACEBOOK_CAMPAIGNS: MockCampaign[];
export declare const MOCK_TIKTOK_CAMPAIGNS: MockCampaign[];
export declare const MOCK_LINE_ADS_CAMPAIGNS: MockCampaign[];
export declare const ALL_MOCK_CAMPAIGNS: MockCampaign[];
export declare function getMockCampaignsByPlatform(platform: string): MockCampaign[];
