import { PrismaService } from '../../prisma/prisma.service';
export declare class VerificationSeeder {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    seedHeavyCampaigns(tenantId: string, count?: number): Promise<{
        success: boolean;
        tenantId: string;
        requested: number;
        insertedCampaigns: number;
        insertedMetrics: number;
        batchSize: number;
        metricsDaysPerCampaign: number;
        durationMs: number;
    }>;
}
