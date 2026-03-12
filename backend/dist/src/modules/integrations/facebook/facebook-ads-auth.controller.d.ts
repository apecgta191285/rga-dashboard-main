import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { FacebookAdsOAuthService } from './facebook-ads-oauth.service';
export declare class FacebookAdsAuthController {
    private readonly oauthService;
    private readonly configService;
    private readonly frontendUrl;
    constructor(oauthService: FacebookAdsOAuthService, configService: ConfigService);
    getAuthUrl(req: any): Promise<{
        authUrl: string;
        message: string;
    }>;
    handleCallback(code: string, state: string, res: Response): Promise<void>;
    getTempAccounts(tempToken: string): Promise<any>;
    completeConnection(req: any, tempToken: string, accountId: string): Promise<{
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
    getConnectedAccounts(req: any): Promise<{
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
}
