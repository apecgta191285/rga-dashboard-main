import { CampaignStatus } from '@prisma/client';
export declare class GoogleAdsMapperService {
    mapCampaignStatus(googleStatus: number | string): CampaignStatus;
    transformCampaigns(results: any[]): {
        externalId: any;
        name: any;
        status: import(".prisma/client").$Enums.CampaignStatus;
        platform: "GOOGLE_ADS";
        channelType: any;
        metrics: {
            clicks: any;
            impressions: any;
            cost: number;
            conversions: any;
            ctr: any;
        };
        budget: number;
    }[];
    transformMetrics(metrics: any[]): {
        date: Date;
        campaignId: any;
        campaignName: any;
        impressions: number;
        clicks: number;
        cost: number;
        conversions: number;
        conversionValue: number;
        ctr: number;
        cpc: number;
        cpm: number;
    }[];
}
