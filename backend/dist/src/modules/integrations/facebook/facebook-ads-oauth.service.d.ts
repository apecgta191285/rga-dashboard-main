import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { EncryptionService } from '../../../common/services/encryption.service';
export declare class FacebookAdsOAuthService {
    private readonly prisma;
    private readonly configService;
    private readonly httpService;
    private readonly encryptionService;
    private cacheManager;
    private readonly logger;
    private readonly appId;
    private readonly appSecret;
    private readonly redirectUri;
    private readonly apiVersion;
    constructor(prisma: PrismaService, configService: ConfigService, httpService: HttpService, encryptionService: EncryptionService, cacheManager: Cache);
    generateAuthUrl(userId: string, tenantId: string): Promise<string>;
    handleCallback(code: string, state: string): Promise<{
        status: string;
        tempToken: any;
    }>;
    private exchangeForLongLivedToken;
    private getAdAccounts;
    getTempAccounts(tempToken: string): Promise<any>;
    completeConnection(tempToken: string, accountId: string, tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        lastSyncAt: Date | null;
        accountName: string | null;
        accessToken: string;
        tokenExpiresAt: Date | null;
        accountId: string;
    }>;
    getConnectedAccounts(tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        lastSyncAt: Date | null;
        accountName: string | null;
        accessToken: string;
        tokenExpiresAt: Date | null;
        accountId: string;
    }[]>;
    disconnect(tenantId: string): Promise<boolean>;
}
