import { CampaignStatus, AdPlatform } from '@prisma/client';
export declare enum PeriodEnum {
    SEVEN_DAYS = "7d",
    THIRTY_DAYS = "30d",
    THIS_MONTH = "this_month",
    LAST_MONTH = "last_month"
}
export declare class GetDashboardOverviewDto {
    period?: PeriodEnum;
    startDate?: string;
    endDate?: string;
    tenantId?: string;
}
export declare class SummaryMetricsDto {
    totalImpressions: number;
    totalClicks: number;
    totalCost: number;
    totalConversions: number;
    averageCtr: number;
    averageRoas: number;
    averageCpm: number;
    averageRoi: number;
}
export declare class GrowthMetricsDto {
    impressionsGrowth: number | null;
    clicksGrowth: number | null;
    costGrowth: number | null;
    conversionsGrowth: number | null;
    ctrGrowth: number | null;
    cpmGrowth: number | null;
    roasGrowth: number | null;
    roiGrowth: number | null;
}
export declare class TrendDataPointDto {
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
}
export declare class RecentCampaignDto {
    id: string;
    name: string;
    status: CampaignStatus;
    platform: AdPlatform;
    spending: number;
    impressions: number;
    clicks: number;
    conversions: number;
    budgetUtilization?: number;
}
export declare class ResponseMetaDto {
    period: PeriodEnum;
    dateRange: {
        from: string;
        to: string;
    };
    tenantId: string;
    generatedAt: string;
}
export declare class DashboardOverviewDataDto {
    [x: string]: any;
    summary: SummaryMetricsDto;
    growth: GrowthMetricsDto;
    trends: TrendDataPointDto[];
    recentCampaigns: RecentCampaignDto[];
    isDemo?: boolean;
}
export declare class DashboardOverviewResponseDto {
    success: boolean;
    data: DashboardOverviewDataDto;
    meta: ResponseMetaDto;
}
