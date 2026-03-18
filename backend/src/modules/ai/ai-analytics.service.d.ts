import { PrismaService } from '../prisma/prisma.service';
export declare class AiAnalyticsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    collectUserBehavior(tenantId: string, userId: string, action: string, data: any): Promise<void>;
    trackBusinessMetrics(tenantId: string, metrics: any): Promise<void>;
    generateInsights(tenantId: string, type: string): Promise<{
        type: string;
        title: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        source: string;
        message: string | null;
        payload: import("@prisma/client/runtime/client").JsonValue | null;
        occurredAt: Date;
    }>;
    getAnalyticsDashboard(tenantId: string, period?: string): Promise<{
        userBehavior: {
            totalSessions: number;
            averageSessionDuration: number;
            topActions: any[];
            uniqueUsers: number;
        };
        businessMetrics: {
            totalRevenue: number;
            conversionRate: number;
            campaignPerformance: any[];
            customerSegments: any[];
        };
        aiInsights: {
            totalInsights: number;
            activeInsights: number;
            insightsByType: {};
            recentInsights: any[];
        };
        period: string;
        generatedAt: Date;
    }>;
    processDailyAnalytics(): Promise<void>;
    private getUserBehaviorStats;
    private getBusinessMetricsStats;
    private getAiInsightsStats;
    private generateDailyInsights;
    private aggregateDailyMetrics;
}
