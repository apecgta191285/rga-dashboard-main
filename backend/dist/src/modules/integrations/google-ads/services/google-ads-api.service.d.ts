import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleAdsClientService } from './google-ads-client.service';
import { EncryptionService } from '../../../../common/services/encryption.service';
export declare class GoogleAdsApiService {
    private readonly configService;
    private readonly prisma;
    private readonly googleAdsClientService;
    private readonly encryptionService;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, googleAdsClientService: GoogleAdsClientService, encryptionService: EncryptionService);
    private createOAuthClient;
    private decryptRefreshToken;
    refreshTokenIfNeeded(account: any): Promise<void>;
    fetchCampaigns(account: any): Promise<import("google-ads-node/build/protos/protos").google.ads.googleads.v14.services.IGoogleAdsRow[]>;
    fetchCampaignMetrics(account: any, campaignId: string, startDate: Date, endDate: Date): Promise<import("google-ads-node/build/protos/protos").google.ads.googleads.v14.services.IGoogleAdsRow[]>;
    private handleApiError;
}
