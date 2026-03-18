import { PrismaService } from '../../modules/prisma/prisma.service';
export declare class EcommerceRollupService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private dateKey;
    private stableNumber;
    private clamp;
    backfillLastNDaysForAllTenants(days?: number): Promise<void>;
    backfillLastNDaysForTenant(tenantId: string, days?: number): Promise<void>;
    upsertDailyEcommerceForTenant(tenantId: string, date: Date): Promise<void>;
}
