import { MarketingPlatformAdapter, PlatformCredentials, DateRange } from '../common/marketing-platform.adapter';
import { Campaign, Metric } from '@prisma/client';
import { GoogleAdsCampaignService } from './google-ads-campaign.service';
export declare class GoogleAdsService implements MarketingPlatformAdapter {
    private readonly campaignService;
    private readonly logger;
    constructor(campaignService: GoogleAdsCampaignService);
    validateCredentials(credentials: PlatformCredentials): Promise<boolean>;
    fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]>;
    fetchMetrics(credentials: PlatformCredentials, campaignId: string, range: DateRange): Promise<Partial<Metric>[]>;
}
