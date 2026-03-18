import { PrismaService } from '../prisma/prisma.service';
export declare class MockDataSeederService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private generateDailyMetrics;
    seedCampaignMetrics(campaignId: string, days?: number): Promise<{
        success: boolean;
        createdCount: number;
        skippedCount: number;
        campaignId: string;
    }>;
    seedAccountMetrics(accountId: string, days?: number): Promise<{
        success: boolean;
        totalCampaigns: number;
        totalMetricsCreated: number;
    }>;
    hasCampaignMetrics(campaignId: string): Promise<boolean>;
    needsSeeding(campaignId: string, days?: number): Promise<boolean>;
    private generateGA4DailyMetrics;
    seedGA4Metrics(tenantId: string, propertyId: string, days?: number): Promise<{
        success: boolean;
        createdCount: number;
        skippedCount: number;
    }>;
}
