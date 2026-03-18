import { MockDataSeederService } from './mock-data-seeder.service';
export declare class DevController {
    private readonly mockSeeder;
    private readonly logger;
    constructor(mockSeeder: MockDataSeederService);
    private ensureNotProduction;
    seedAll(user: any): Promise<{
        success: boolean;
        results: Record<string, unknown>;
    }>;
    seedCampaigns(user: any): Promise<{
        success: boolean;
        createdCount: number;
    }>;
    seedMetrics(user: any, days?: number): Promise<{
        success: boolean;
        campaignsCount: number;
        metricsCreated: number;
    }>;
    seedAlerts(user: any): Promise<{
        success: boolean;
        createdCount: number;
    }>;
    seedSyncLogs(user: any): Promise<{
        success: boolean;
        createdCount: number;
    }>;
    seedByPlatform(user: any, platform: string): Promise<{
        success: boolean;
        createdCount: number;
    }>;
    clearMockData(user: any): Promise<{
        success: boolean;
        deleted: {
            metrics: number;
            ga4Metrics: number;
            alerts: number;
        };
    }>;
    clearCampaigns(user: any): Promise<{
        success: boolean;
        deleted: {
            metrics: number;
            campaigns: number;
        };
    }>;
}
