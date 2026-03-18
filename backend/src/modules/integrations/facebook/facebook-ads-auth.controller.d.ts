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
        accessToken: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        accountId: string;
        accountName: string | null;
        tokenExpiresAt: Date | null;
        lastSyncAt: Date | null;
    }>;
    getConnectedAccounts(req: any): Promise<{
        id: string;
        accessToken: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        accountId: string;
        accountName: string | null;
        tokenExpiresAt: Date | null;
        lastSyncAt: Date | null;
    }[]>;
}
