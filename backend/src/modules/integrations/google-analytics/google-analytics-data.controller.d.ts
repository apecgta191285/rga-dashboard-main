import { GoogleAnalyticsService } from './google-analytics.service';
export declare class GoogleAnalyticsDataController {
    private readonly analyticsService;
    constructor(analyticsService: GoogleAnalyticsService);
    getBasicMetrics(tenantId: string, startDate?: string, endDate?: string): Promise<{
        connected: boolean;
        totals: any;
        rows: any[];
        message: string;
        error?: undefined;
    } | {
        totals: {
            activeUsers: number;
            sessions: number;
            newUsers: number;
            engagementRate: number;
        };
        rows: any;
        connected: boolean;
        isMockData: boolean;
        message?: undefined;
        error?: undefined;
    } | {
        connected: boolean;
        error: boolean;
        message: string;
        totals: any;
        rows: any[];
    }>;
}
