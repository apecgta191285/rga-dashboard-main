import { SuppabetService } from './suppabet.service';
export declare class SuppabetController {
    private readonly suppabetService;
    constructor(suppabetService: SuppabetService);
    getMatches(tenantId: string, days?: string): Promise<any[]>;
    getSummary(tenantId: string, days?: string): Promise<{
        totalVolume: number;
        totalProfit: number;
        totalBets: number;
        matchCount: number;
    }>;
}
