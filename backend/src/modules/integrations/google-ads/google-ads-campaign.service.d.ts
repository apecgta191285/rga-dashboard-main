import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAdsApiService } from './services/google-ads-api.service';
import { GoogleAdsMapperService } from './services/google-ads-mapper.service';
export declare class GoogleAdsCampaignService {
    private readonly prisma;
    private readonly googleAdsApiService;
    private readonly googleAdsMapperService;
    private readonly logger;
    constructor(prisma: PrismaService, googleAdsApiService: GoogleAdsApiService, googleAdsMapperService: GoogleAdsMapperService);
    private findAccount;
    fetchCampaigns(accountId: string): Promise<{
        accountId: any;
        accountName: any;
        customerId: any;
        campaigns: {
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
        totalCampaigns: number;
    }>;
    getAccounts(tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        accountName: string;
        lastSyncAt: Date;
        customerId: string;
    }[]>;
    fetchCampaignMetrics(accountId: string, campaignId: string, startDate: Date, endDate: Date): Promise<{
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
    }[]>;
}
