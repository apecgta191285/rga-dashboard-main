export declare enum EcommercePeriod {
    D7 = "7d",
    D30 = "30d",
    THIS_MONTH = "this_month",
    LAST_MONTH = "last_month"
}
export declare class GetEcommerceSummaryDto {
    period?: EcommercePeriod;
    tenantId?: string;
}
export declare class EcommerceSummaryResponseDto {
    totalRevenue: number;
    revenueTrend: number;
    totalOrders: number;
    ordersTrend: number;
    averageOrderValue: number;
    aovTrend: number;
    conversionRate: number;
    crTrend: number;
    cartAbandonmentRate: number;
    abandonmentTrend: number;
}
