import { GoogleAdsOAuthService } from './google-ads-oauth.service';
import { UnifiedSyncService } from '../../sync/unified-sync.service';
export declare class GoogleAdsIntegrationController {
    private readonly oauthService;
    private readonly unifiedSyncService;
    constructor(oauthService: GoogleAdsOAuthService, unifiedSyncService: UnifiedSyncService);
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
    getAuthUrl(req: any): Promise<{
        url: string;
    }>;
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
    connectAccount(tempToken: string, customerId: string, req: any): Promise<{
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
    disconnect(req: any): Promise<boolean>;
    triggerSync(req: any): Promise<{
        success: boolean;
        message: string;
        results: any[];
    }>;
}
