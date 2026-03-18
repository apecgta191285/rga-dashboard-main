import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TikTokAdsOAuthService } from './tiktok-ads-oauth.service';
export declare class TikTokAdsController {
    private readonly oauthService;
    private readonly configService;
    private readonly frontendUrl;
    constructor(oauthService: TikTokAdsOAuthService, configService: ConfigService);
    getAuthUrl(req: any): {
        isSandbox: boolean;
        message: string;
        connectEndpoint: string;
        url?: undefined;
    } | {
        isSandbox: boolean;
        url: string;
        message: string;
        connectEndpoint?: undefined;
    };
    handleCallback(code: string, state: string, res: Response): Promise<void>;
    getTempAccounts(tempToken: string): Promise<{
        success: boolean;
        accounts: import("../common/oauth-provider.interface").OAuthAccount[];
        count: number;
    }>;
    completeConnection(req: any, tempToken: string, advertiserId: string): Promise<import("../common/oauth-provider.interface").OAuthConnectionResult>;
    connectSandbox(req: any): Promise<import("../common/oauth-provider.interface").OAuthConnectionResult>;
    getConnectedAccounts(req: any): Promise<{
        success: boolean;
        accounts: any[];
        count: number;
    }>;
    disconnect(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    refreshToken(req: any, accountId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
