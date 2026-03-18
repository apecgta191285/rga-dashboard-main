import { LineAdsOAuthService } from './line-ads-oauth.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
export declare class LineAdsController {
    private readonly lineAdsOAuthService;
    private readonly configService;
    private readonly frontendUrl;
    constructor(lineAdsOAuthService: LineAdsOAuthService, configService: ConfigService);
    getAuthUrl(req: any): {
        url: string;
    };
    handleCallback(code: string, state: string, res: Response): Promise<void>;
}
