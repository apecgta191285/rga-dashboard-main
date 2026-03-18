import { FacebookAdsOAuthService } from './facebook-ads-oauth.service';
export declare class FacebookAdsIntegrationController {
    private readonly oauthService;
    constructor(oauthService: FacebookAdsOAuthService);
    getStatus(req: any): Promise<{
        isConnected: boolean;
        lastSyncAt: Date;
        accounts: {
            id: string;
            externalId: string;
            name: string;
            status: string;
        }[];
    }>;
    getConnectedAccounts(req: any): Promise<{
        accounts: {
            id: string;
            externalId: string;
            name: string;
            status: string;
            lastSyncAt: Date;
            createdAt: Date;
        }[];
    }>;
    disconnect(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
