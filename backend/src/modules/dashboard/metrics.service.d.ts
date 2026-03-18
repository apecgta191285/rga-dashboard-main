import { PrismaService } from '../prisma/prisma.service';
export declare class MetricsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMetricsTrends(tenantId: string, period: string, compareWith?: 'previous_period'): Promise<{
        period: string;
        startDate: Date;
        endDate: Date;
        current: {
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            sessions: number;
            ctr: number;
            cpc: number;
            roas: number;
        };
        previous: any;
        trends: {
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            sessions: number;
            ctr: number;
            cpc: number;
            roas: number;
        };
    }>;
    private getAggregatedMetrics;
    private calculateTrends;
    getDailyMetrics(tenantId: string, period: string): Promise<{
        period: string;
        startDate: Date;
        endDate: Date;
        data: {
            date: Date;
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            ctr: number;
            roas: number;
        }[];
    }>;
    getTimeSeries(tenantId: string, metric: 'impressions' | 'clicks' | 'spend' | 'conversions' | 'revenue' | 'sessions', startDate: Date, endDate: Date): Promise<{
        metric: "sessions";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "impressions";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "clicks";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "conversions";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "spend";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "revenue";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    }>;
    getCampaignPerformance(campaignId: string, startDate: Date, endDate: Date): Promise<{
        campaignId: string;
        startDate: Date;
        endDate: Date;
        totals: {
            ctr: number;
            cpc: number;
            roas: number;
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
        };
        daily: {
            date: Date;
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            ctr: number;
            cpc: number;
            roas: number;
        }[];
    }>;
}
