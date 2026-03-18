import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketingPlatformAdapter, PlatformCredentials, DateRange } from '../common/marketing-platform.adapter';
import { Campaign, Metric } from '@prisma/client';
export declare class FacebookAdsService implements MarketingPlatformAdapter {
    private readonly prisma;
    private readonly config;
    private readonly httpService;
    private readonly logger;
    private readonly apiVersion;
    private readonly baseUrl;
    constructor(prisma: PrismaService, config: ConfigService, httpService: HttpService);
    validateCredentials(credentials: PlatformCredentials): Promise<boolean>;
    fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]>;
    fetchMetrics(credentials: PlatformCredentials, campaignId: string, range: DateRange): Promise<Partial<Metric>[]>;
    exchangeToken(shortLivedToken: string): Promise<string>;
    private mapStatus;
}
