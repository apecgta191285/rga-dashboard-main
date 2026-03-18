import { MarketingPlatformAdapter } from './marketing-platform.adapter';
import { GoogleAdsService } from '../google-ads/google-ads.service';
import { FacebookAdsService } from '../facebook/facebook-ads.service';
import { GoogleAnalyticsAdapterService } from '../google-analytics/google-analytics-adapter.service';
import { TikTokAdsService } from '../tiktok/tiktok-ads.service';
import { LineAdsAdapterService } from '../line-ads/line-ads-adapter.service';
import { AdPlatform } from '@prisma/client';
export declare class IntegrationFactory {
    private readonly googleAdsService;
    private readonly facebookAdsService;
    private readonly googleAnalyticsAdapterService;
    private readonly tiktokAdsService;
    private readonly lineAdsAdapterService;
    constructor(googleAdsService: GoogleAdsService, facebookAdsService: FacebookAdsService, googleAnalyticsAdapterService: GoogleAnalyticsAdapterService, tiktokAdsService: TikTokAdsService, lineAdsAdapterService: LineAdsAdapterService);
    getAdapter(platform: string | AdPlatform): MarketingPlatformAdapter;
}
