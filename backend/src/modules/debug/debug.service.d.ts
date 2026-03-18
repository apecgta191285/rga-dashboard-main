import { PrismaService } from '../prisma/prisma.service';
export declare class DebugService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    clearMockData(): Promise<{
        success: boolean;
        deletedMetrics: number;
        deletedGA4Records: number;
    }>;
}
