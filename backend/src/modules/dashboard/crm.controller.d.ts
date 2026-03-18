import { CrmService } from './crm.service';
import { GetCrmSummaryDto, CrmSummaryResponseDto } from './dto/crm-summary.dto';
export declare class CrmController {
    private readonly crmService;
    constructor(crmService: CrmService);
    getSummary(user: any, query: GetCrmSummaryDto): Promise<CrmSummaryResponseDto>;
    getPipelineTrends(user: any, days?: number, tenantIdQuery?: string): Promise<{
        date: string;
        leads: number;
        value: number;
    }[]>;
}
