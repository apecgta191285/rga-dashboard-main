// SEO Feature Types

export interface SeoMetricSummary {
    organicSessions: number;
    goalCompletions: number | null;
    avgPosition: number | null;
    avgPositionTrend?: number;
    avgTimeOnPage: number; // in seconds
    bounceRate: number;
    organicSessionsTrend?: number;
    newUsers?: number;
    newUsersTrend?: number;
    avgTimeOnPageTrend?: number;
    goalCompletionsTrend?: number;
    // New metrics from design
    ur: number | null;
    dr: number | null;
    backlinks: number | null;
    referringDomains: number | null;
    keywords: number | null;
    trafficCost: number | null;

    // Web Analytics
    screenPageViews?: number;
    screenPageViewsTrend?: number;
    engagementRate?: number;
    engagementRateTrend?: number;
    activeUsers?: number;
    activeUsersTrend?: number;
    bounceRateTrend?: number;
}

export interface SeoTrendData {
    date: string;
    traffic: number;
    position: number | null;
}
