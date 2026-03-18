import { GoogleAdsCampaignService } from './google-ads-campaign.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UnifiedSyncService } from '../../sync/unified-sync.service';
export declare class GoogleAdsCampaignController {
    private readonly campaignService;
    private readonly prisma;
    private readonly unifiedSyncService;
    constructor(campaignService: GoogleAdsCampaignService, prisma: PrismaService, unifiedSyncService: UnifiedSyncService);
    private validateAccountOwnership;
    fetchCampaigns(accountId: string, req: any): Promise<{
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
    syncCampaigns(accountId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    syncCampaignMetrics(accountId: string, campaignId: string, days: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    syncAllCampaignMetrics(accountId: string, days: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
