import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { GoogleAnalyticsOAuthService } from './google-analytics-oauth.service';
export declare class GoogleAnalyticsAuthController {
    private readonly oauthService;
    private readonly configService;
    private readonly frontendUrl;
    private readonly logger;
    constructor(oauthService: GoogleAnalyticsOAuthService, configService: ConfigService);
    getAuthUrl(req: any): Promise<{
        authUrl: string;
        message: string;
    }>;
    handleCallback(code: string, state: string, res: Response): Promise<void>;
    getTempProperties(tempToken: string): Promise<unknown>;
    completeConnection(req: any, tempToken: string, propertyId: string): Promise<{
        success: boolean;
        accountId: string;
    }>;
    getStatus(tenantId: string): Promise<{
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
