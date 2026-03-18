import { PrismaService } from '../prisma/prisma.service';
import { GetCrmSummaryDto, CrmSummaryResponseDto } from './dto/crm-summary.dto';
export declare class CrmService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toNumber;
    getSummary(tenantId: string, query: GetCrmSummaryDto): Promise<CrmSummaryResponseDto>;
    getPipelineTrends(tenantId: string, days?: number): Promise<{
        date: string;
        leads: number;
        value: number;
    }[]>;
}
