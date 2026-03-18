import { ConfigService } from '@nestjs/config';
export declare class GoogleSearchConsoleService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    getSiteUrl(tenantSettings?: any): string | null;
    hasCredentials(): boolean;
    private getAuth;
    querySearchAnalytics(params: {
        siteUrl: string;
        startDate: string;
        endDate: string;
        rowLimit?: number;
        startRow?: number;
        dimensions?: string[];
    }): Promise<import("googleapis").searchconsole_v1.Schema$SearchAnalyticsQueryResponse>;
}
