import { ConfigService } from '@nestjs/config';
import { MarketingPlatformAdapter, PlatformCredentials, DateRange } from '../common/marketing-platform.adapter';
import { Campaign, Metric } from '@prisma/client';
export declare class TikTokAdsService implements MarketingPlatformAdapter {
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    validateCredentials(credentials: PlatformCredentials): Promise<boolean>;
    fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]>;
    fetchMetrics(credentials: PlatformCredentials, campaignId: string, range: DateRange): Promise<Partial<Metric>[]>;
    private mapStatus;
}
