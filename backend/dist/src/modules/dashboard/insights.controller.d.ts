import { InsightsService } from './insights.service';
export declare class InsightsController {
    private readonly insightsService;
    constructor(insightsService: InsightsService);
    getInsights(tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
        status: string;
        title: string | null;
        source: string;
        message: string | null;
        payload: import("@prisma/client/runtime/client").JsonValue | null;
        occurredAt: Date;
    }[]>;
}
