import { PrismaService } from '../prisma/prisma.service';
export declare class InsightsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAiInsights(tenantId: string): Promise<{
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
