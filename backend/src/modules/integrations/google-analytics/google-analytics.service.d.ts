import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAnalyticsApiService } from './google-analytics-api.service';
export declare class GoogleAnalyticsService {
    private config;
    private prisma;
    private apiService;
    private readonly logger;
    constructor(config: ConfigService, prisma: PrismaService, apiService: GoogleAnalyticsApiService);
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
    private parseDateRange;
    private transformResponse;
}
