import { PrismaService } from '../prisma/prisma.service';
export declare class MockDataSeederService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    seedCampaignMetrics(campaignId: string, days?: number): Promise<{
        success: boolean;
        createdCount: number;
        skippedCount: number;
        campaignId: string;
    }>;
    seedGA4Metrics(tenantId: string, propertyId: string, days?: number): Promise<{
        success: boolean;
        createdCount: number;
        skippedCount: number;
    }>;
    seedAlerts(tenantId: string, count?: number): Promise<{
        success: boolean;
        createdCount: number;
    }>;
    seedSyncLogs(tenantId: string, count?: number): Promise<{
        success: boolean;
        createdCount: number;
    }>;
    seedCampaigns(tenantId: string, platforms?: string[]): Promise<{
        success: boolean;
        createdCount: number;
    }>;
    seedAll(tenantId: string, options?: {
        campaigns?: boolean;
        metrics?: boolean;
        alerts?: boolean;
        syncLogs?: boolean;
        metricDays?: number;
    }): Promise<{
        success: boolean;
        results: Record<string, unknown>;
    }>;
    clearMockData(tenantId: string): Promise<{
        success: boolean;
        deleted: {
            metrics: number;
            ga4Metrics: number;
            alerts: number;
        };
    }>;
    seedAllCampaignMetrics(tenantId: string, days?: number): Promise<{
        success: boolean;
        campaignsCount: number;
        metricsCreated: number;
    }>;
    clearCampaignsAndMetrics(tenantId: string): Promise<{
        success: boolean;
        deleted: {
            metrics: number;
            campaigns: number;
        };
    }>;
}
