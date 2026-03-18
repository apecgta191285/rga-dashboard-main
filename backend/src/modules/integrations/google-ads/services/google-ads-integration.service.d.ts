import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleAdsOAuthService } from '../google-ads-oauth.service';
import { GoogleAdsClientService } from './google-ads-client.service';
export declare class GoogleAdsIntegrationService {
    private readonly prisma;
    private readonly oauthService;
    private readonly clientService;
    constructor(prisma: PrismaService, oauthService: GoogleAdsOAuthService, clientService: GoogleAdsClientService);
    getAuthUrl(userId: string, tenantId: string): Promise<{
        authUrl: string;
    }>;
}
