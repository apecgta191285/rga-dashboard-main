import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../../common/services/encryption.service';
export declare class LineAdsOAuthService {
    private readonly configService;
    private readonly prisma;
    private readonly encryptionService;
    private readonly logger;
    private readonly channelId;
    private readonly channelSecret;
    private readonly redirectUri;
    private readonly authBaseUrl;
    constructor(configService: ConfigService, prisma: PrismaService, encryptionService: EncryptionService);
    generateAuthUrl(userId: string, tenantId: string): string;
    handleCallback(code: string, state: string): Promise<{
        success: boolean;
    }>;
}
