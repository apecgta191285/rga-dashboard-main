import { MarketingPlatformAdapter, PlatformCredentials, DateRange } from '../common/marketing-platform.adapter';
import { Campaign, Metric } from '@prisma/client';
import { GoogleAnalyticsApiService } from './google-analytics-api.service';
export declare class GoogleAnalyticsAdapterService implements MarketingPlatformAdapter {
    private readonly apiService;
    private readonly logger;
    constructor(apiService: GoogleAnalyticsApiService);
    validateCredentials(credentials: PlatformCredentials): Promise<boolean>;
    fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]>;
    fetchMetrics(credentials: PlatformCredentials, campaignId: string, range: DateRange): Promise<Partial<Metric>[]>;
    private parseDate;
}
