import { InsightsService } from './insights.service';
export declare class InsightsController {
    private readonly insightsService;
    constructor(insightsService: InsightsService);
    getInsights(tenantId: string): Promise<{
        type: string;
        title: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        source: string;
        message: string | null;
        payload: import("@prisma/client/runtime/client").JsonValue | null;
        occurredAt: Date;
    }[]>;
}
