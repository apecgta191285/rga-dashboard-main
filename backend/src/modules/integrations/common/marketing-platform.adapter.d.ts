import { Campaign, Metric } from '@prisma/client';
export interface DateRange {
    startDate: Date;
    endDate: Date;
}
export interface PlatformCredentials {
    accessToken: string;
    refreshToken?: string;
    accountId: string;
}
export interface MarketingPlatformAdapter {
    fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]>;
    fetchMetrics(credentials: PlatformCredentials, campaignId: string, range: DateRange): Promise<Partial<Metric>[]>;
    validateCredentials(credentials: PlatformCredentials): Promise<boolean>;
}
