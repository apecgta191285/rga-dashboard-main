import { PrismaService } from '../../../prisma/prisma.service';
import { MockDataSeederService } from '../../../dashboard/mock-data-seeder.service';
import { GoogleAdsApiService } from './google-ads-api.service';
import { GoogleAdsMapperService } from './google-ads-mapper.service';
export declare class GoogleAdsSyncService {
    private readonly prisma;
    private readonly googleAdsApiService;
    private readonly googleAdsMapperService;
    private readonly mockDataSeeder;
    private readonly logger;
    constructor(prisma: PrismaService, googleAdsApiService: GoogleAdsApiService, googleAdsMapperService: GoogleAdsMapperService, mockDataSeeder: MockDataSeederService);
    syncCampaigns(accountId: string): Promise<{
        synced: number;
        campaigns: any[];
        createdCount: number;
        updatedCount: number;
    }>;
    syncCampaignMetrics(accountId: string, campaignId: string, days?: number): Promise<{
        success: boolean;
        campaignId: string;
        campaignName: string;
        syncedCount: number;
        createdCount: number;
        updatedCount: number;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        lastSyncedAt: Date;
    }>;
    syncAllCampaignMetrics(accountId: string, days?: number): Promise<{
        success: boolean;
        accountId: string;
        totalCampaigns: number;
        successCount: number;
        errorCount: number;
        results: ({
            success: boolean;
            campaignId: string;
            campaignName: string;
            syncedCount: number;
            createdCount: number;
            updatedCount: number;
            dateRange: {
                startDate: string;
                endDate: string;
            };
            lastSyncedAt: Date;
        } | {
            success: boolean;
            campaignId: string;
            campaignName: string;
            error: any;
        })[];
        lastSyncedAt: Date;
    }>;
}
