import { PrismaClient } from '@prisma/client';
export declare class VerificationRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    countMetrics(tenantId: string, windowStart: Date, windowEnd: Date): Promise<number>;
    countDriftMetrics(tenantId: string, windowStart: Date, windowEnd: Date): Promise<number>;
    checkMockFlagConsistency(tenantId: string): Promise<number>;
    getAggregates(tenantId: string, windowStart: Date, windowEnd: Date): Promise<{
        campaignId: string;
        campaignName: string;
        platform: import(".prisma/client").$Enums.AdPlatform;
        budget: number;
        budgetType: string;
        impressions: number;
        clicks: number;
        spend: number;
        conversions: number;
        revenue: number;
    }[]>;
}
