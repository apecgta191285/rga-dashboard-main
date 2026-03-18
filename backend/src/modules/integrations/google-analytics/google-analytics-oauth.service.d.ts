import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Cache } from 'cache-manager';
import { UnifiedSyncService } from '../../sync/unified-sync.service';
import { EncryptionService } from '../../../common/services/encryption.service';
export declare class GoogleAnalyticsOAuthService {
    private readonly configService;
    private readonly prisma;
    private cacheManager;
    private readonly unifiedSyncService;
    private readonly encryptionService;
    private oauth2Client;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, cacheManager: Cache, unifiedSyncService: UnifiedSyncService, encryptionService: EncryptionService);
    generateAuthUrl(userId: string, tenantId: string): Promise<string>;
    handleCallback(code: string, state: string): Promise<{
        status: string;
        properties: any[];
        tempToken: any;
    }>;
    getTempProperties(tempToken: string): Promise<unknown>;
    completeConnection(tempToken: string, propertyId: string, tenantId: string): Promise<{
        success: boolean;
        accountId: string;
    }>;
    private triggerInitialSync;
    private listProperties;
    getConnectionStatus(tenantId: string): Promise<{
        isConnected: boolean;
        account: {
            id: string;
            createdAt: Date;
            status: string;
            propertyId: string;
            propertyName: string;
        };
    }>;
}
