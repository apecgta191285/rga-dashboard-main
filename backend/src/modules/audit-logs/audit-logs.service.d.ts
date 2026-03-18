import { PrismaService } from '../prisma/prisma.service';
export declare class AuditLogsService {
    private prisma;
    constructor(prisma: PrismaService);
    createLog(data: {
        userId?: string;
        action: string;
        resource: string;
        details?: any;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
}
