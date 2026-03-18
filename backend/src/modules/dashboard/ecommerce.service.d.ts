import { PrismaService } from '../prisma/prisma.service';
import { GetEcommerceSummaryDto, EcommerceSummaryResponseDto } from './dto/ecommerce-summary.dto';
export declare class EcommerceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toNumber;
    getSummary(tenantId: string, query: GetEcommerceSummaryDto): Promise<EcommerceSummaryResponseDto>;
    getSalesTrends(tenantId: string, days?: number): Promise<{
        date: string;
        revenue: number;
        orders: number;
    }[]>;
}
