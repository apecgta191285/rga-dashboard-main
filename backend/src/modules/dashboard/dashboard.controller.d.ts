import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { MetricsService } from './metrics.service';
import { ExportService } from './export.service';
import { GetDashboardOverviewDto, DashboardOverviewResponseDto } from './dto/dashboard-overview.dto';
import { IntegrationSwitchService } from '../data-sources/integration-switch.service';
export declare class DashboardController {
    private readonly dashboardService;
    private readonly metricsService;
    private readonly exportService;
    private readonly integrationSwitchService;
    constructor(dashboardService: DashboardService, metricsService: MetricsService, exportService: ExportService, integrationSwitchService: IntegrationSwitchService);
    getOverview(user: any, query: GetDashboardOverviewDto): Promise<DashboardOverviewResponseDto>;
    getMetrics(tenantId: string, range: string, compare: string): Promise<{
        period: string;
        startDate: Date;
        endDate: Date;
        current: {
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            sessions: number;
            ctr: number;
            cpc: number;
            roas: number;
        };
        previous: any;
        trends: {
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            sessions: number;
            ctr: number;
            cpc: number;
            roas: number;
        };
    }>;
    getSummary(req: any, days?: string): Promise<{
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
    getSummaryByPlatform(req: any, days?: string, platform?: string): Promise<{
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
    getTopCampaigns(req: any, limit?: string, days?: string): Promise<{
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
    getTrends(req: any, days?: string): Promise<{
        date: Date;
        impressions: number;
        clicks: number;
        spend: number;
        conversions: number;
    }[]>;
    getPerformanceByPlatform(req: any, startDate?: string): Promise<{
        platform: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
    }[]>;
    getTimeSeries(tenantId: string, metric: string, startDateStr?: string, endDateStr?: string): Promise<{
        metric: "sessions";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "impressions";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "clicks";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "conversions";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "spend";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    } | {
        metric: "revenue";
        startDate: Date;
        endDate: Date;
        data: {
            date: string;
            value: number;
        }[];
    }>;
    getMetricsTrends(user: any, period?: string, compare?: 'previous_period'): Promise<{
        period: string;
        startDate: Date;
        endDate: Date;
        current: {
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            sessions: number;
            ctr: number;
            cpc: number;
            roas: number;
        };
        previous: any;
        trends: {
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            sessions: number;
            ctr: number;
            cpc: number;
            roas: number;
        };
    }>;
    getDailyMetrics(user: any, period?: string): Promise<{
        period: string;
        startDate: Date;
        endDate: Date;
        data: {
            date: Date;
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            ctr: number;
            roas: number;
        }[];
    }>;
    exportCampaignsCSV(user: any, platform?: string, status?: string): Promise<import("@nestjs/common").StreamableFile>;
    exportMetricsPDF(user: any, period?: '7d' | '30d', res?: Response): Promise<void>;
    getOnboardingStatus(tenantId: string): Promise<{
        googleAds: boolean;
        googleAnalytics: boolean;
        kpiTargets: boolean;
        teamMembers: boolean;
    }>;
}
