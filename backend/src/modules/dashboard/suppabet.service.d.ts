import { PrismaService } from '../prisma/prisma.service';
export declare class SuppabetService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMatches(tenantId: string, days?: number): Promise<any[]>;
    getSummary(tenantId: string, days?: number): Promise<{
        totalVolume: number;
        totalProfit: number;
        totalBets: number;
        matchCount: number;
    }>;
}
