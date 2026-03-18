import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAdsClientService } from './services/google-ads-client.service';
import { GoogleAdsCampaignService } from './google-ads-campaign.service';
import { Cache } from 'cache-manager';
import { UnifiedSyncService } from '../../sync/unified-sync.service';
import { EncryptionService } from '../../../common/services/encryption.service';
export declare class GoogleAdsOAuthService {
    private readonly configService;
    private readonly prisma;
    private readonly googleAdsClientService;
    private readonly googleAdsCampaignService;
    private readonly unifiedSyncService;
    private readonly encryptionService;
    private cacheManager;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, googleAdsClientService: GoogleAdsClientService, googleAdsCampaignService: GoogleAdsCampaignService, unifiedSyncService: UnifiedSyncService, encryptionService: EncryptionService, cacheManager: Cache);
    private createOAuthClient;
    generateAuthUrl(userId: string, tenantId: string): Promise<string>;
    handleCallback(code: string, state: string): Promise<{
        status: string;
        accounts: {
            id: string;
            name: string;
            type: "ACCOUNT" | "MANAGER";
            parentMccId?: string;
            parentMccName?: string;
            status: string;
        }[];
        tempToken: any;
    }>;
    getTempAccounts(tempToken: string): Promise<unknown>;
    completeConnection(tempToken: string, customerId: string, tenantId: string): Promise<{
        success: boolean;
        accountId: string;
    }>;
    private triggerInitialSync;
    saveClientAccounts(refreshToken: string, userId: string, tenantId: string, loginCustomerId: string): Promise<any[]>;
    getConnectedAccounts(tenantId: string): Promise<{
        success: boolean;
        accounts: {
            id: string;
            createdAt: Date;
            status: string;
            accountName: string;
            lastSyncAt: Date;
            customerId: string;
        }[];
        count: number;
    }>;
    getAccessToken(tenantId: string, customerId: string): Promise<string>;
    disconnect(tenantId: string): Promise<boolean>;
}
