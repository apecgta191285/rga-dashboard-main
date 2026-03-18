import { MarketingPlatformAdapter, PlatformCredentials, DateRange } from '../common/marketing-platform.adapter';
import { Campaign, Metric } from '@prisma/client';
export declare class LineAdsAdapterService implements MarketingPlatformAdapter {
    private readonly logger;
    constructor();
    validateCredentials(credentials: PlatformCredentials): Promise<boolean>;
    fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]>;
    fetchMetrics(credentials: PlatformCredentials, campaignId: string, range: DateRange): Promise<Partial<Metric>[]>;
}
