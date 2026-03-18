import { PrismaService } from '../../prisma/prisma.service';
export declare class TikTokAdsIntegrationController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStatus(req: any): Promise<{
        isConnected: boolean;
        lastSyncAt: Date;
        accounts: {
            id: string;
            externalId: string;
            name: string;
            status: string;
        }[];
    }>;
    disconnect(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
