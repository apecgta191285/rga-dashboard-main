import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { GoogleAdsOAuthService } from './google-ads-oauth.service';
export declare class GoogleAdsAuthController {
    private readonly oauthService;
    private readonly configService;
    private readonly frontendUrl;
    constructor(oauthService: GoogleAdsOAuthService, configService: ConfigService);
    getAuthUrl(req: any): Promise<{
        authUrl: string;
        message: string;
    }>;
    handleCallback(code: string, state: string, res: Response): Promise<void>;
    getTempAccounts(tempToken: string): Promise<unknown>;
    completeConnection(req: any, tempToken: string, customerId: string): Promise<{
        success: boolean;
        accountId: string;
    }>;
    getConnectedAccounts(req: any): Promise<{
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
}
