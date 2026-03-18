import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { DashboardOverviewResponseDto, GetDashboardOverviewDto } from './dto/dashboard-overview.dto';
import { ProvenanceMode } from 'src/common/provenance.constants';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getSummary(tenantId: string, days?: number, MOCK?: ProvenanceMode): Promise<{
        totalCampaigns: number;
        activeCampaigns: number;
        totalSpend: number;
        totalImpressions: number;
        totalClicks: number;
        totalConversions: number;
        isMockData: boolean;
        trends: {
            campaigns: number;
            spend: number;
            impressions: number;
            clicks: number;
        };
    }>;
    getSummaryByPlatform(tenantId: string, days?: number, platform?: string): Promise<{
        platform: string;
        totalCampaigns: number;
        activeCampaigns: number;
        totalSpend: number;
        totalImpressions: number;
        totalClicks: number;
        totalConversions: number;
        isMockData: boolean;
        trends: {
            spend: number;
            impressions: number;
            clicks: number;
        };
    }>;
    getTopCampaigns(tenantId: string, limit?: number, days?: number): Promise<{
        id: string;
        name: string;
        platform: string;
        status: string;
        metrics: {
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            roas: number;
            ctr: number;
        };
    }[]>;
    getTrends(tenantId: string, days?: number): Promise<{
        date: Date;
        impressions: number;
        clicks: number;
        spend: number;
        conversions: number;
    }[]>;
    getOnboardingStatus(tenantId: string): Promise<{
        googleAds: boolean;
        googleAnalytics: boolean;
        kpiTargets: boolean;
        teamMembers: boolean;
    }>;
    getPerformanceByPlatform(tenantId: string, days?: number, REAL?: ProvenanceMode): Promise<{
        platform: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
    }[]>;
    getOverview(user: {
        tenantId: string;
        role: UserRole;
    }, query: GetDashboardOverviewDto): Promise<DashboardOverviewResponseDto>;
}
