import { EcommerceService } from './ecommerce.service';
import { EcommerceRollupService } from './ecommerce-rollup.service';
import { GetEcommerceSummaryDto, EcommerceSummaryResponseDto } from './dto/ecommerce-summary.dto';
export declare class EcommerceController {
    private readonly ecommerceService;
    private readonly ecommerceRollupService;
    constructor(ecommerceService: EcommerceService, ecommerceRollupService: EcommerceRollupService);
    backfill(tenantId?: string, days?: number): Promise<{
        success: boolean;
        days: number;
    }>;
    getSummary(user: any, query: GetEcommerceSummaryDto): Promise<EcommerceSummaryResponseDto>;
    getSalesTrends(user: any, days?: number, tenantIdQuery?: string): Promise<{
        date: string;
        revenue: number;
        orders: number;
    }[]>;
}
