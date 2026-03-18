import { PrismaService } from '../../prisma/prisma.service';
export declare class LineAdsIntegrationController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStatus(req: any): Promise<{
        isConnected: boolean;
        accounts: {
            id: string;
            createdAt: Date;
            status: string;
            lastSyncAt: Date;
            channelId: string;
            channelName: string;
        }[];
    }>;
    getConnectedAccounts(req: any): Promise<{
        accounts: {
            id: string;
            createdAt: Date;
            status: string;
            lastSyncAt: Date;
            channelId: string;
            channelName: string;
        }[];
    }>;
    disconnect(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
