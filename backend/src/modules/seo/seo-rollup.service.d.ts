import { PrismaService } from '../../modules/prisma/prisma.service';
export declare class SeoRollupService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private dateKey;
    private stableNumber;
    private clamp;
    backfillLastNDaysForTenant(tenantId: string, days?: number): Promise<void>;
    backfillLastNDaysForAllTenants(days?: number): Promise<void>;
    upsertYesterdayForAllTenants(): Promise<void>;
    upsertDailySeoForTenant(tenantId: string, date: Date): Promise<void>;
}
