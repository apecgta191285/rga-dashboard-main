export declare function generateDailyAdMetrics(): {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    revenue: number;
    roas: number;
};
export declare function generateDailyGA4Metrics(): {
    activeUsers: number;
    newUsers: number;
    sessions: number;
    screenPageViews: number;
    engagementRate: number;
    bounceRate: number;
    avgSessionDuration: number;
};
export declare function generateMetricsForDateRange(days?: number, type?: 'ads' | 'ga4'): any[];
