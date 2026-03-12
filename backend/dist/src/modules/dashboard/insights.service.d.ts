import { PrismaService } from '../prisma/prisma.service';
export declare class InsightsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAiInsights(tenantId: string): Promise<{
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
