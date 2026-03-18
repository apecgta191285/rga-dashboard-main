export declare enum TrendPeriod {
    D7 = "7d",
    D30 = "30d",
    THIS_MONTH = "this_month",
    LAST_MONTH = "last_month"
}
export declare class GetTrendAnalysisDto {
    period?: TrendPeriod;
    tenantId?: string;
}
export declare class TrendDataResponseDto {
    date: string;
    cost: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    sessions: number;
}
