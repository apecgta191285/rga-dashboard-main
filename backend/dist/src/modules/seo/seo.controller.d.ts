import { SeoService } from './seo.service';
export declare class SeoController {
    private readonly seoService;
    constructor(seoService: SeoService);
    getSummary(user: any): Promise<{
        organicSessions: number;
        newUsers: number;
        avgTimeOnPage: number;
        organicSessionsTrend: number;
        newUsersTrend: number;
        avgTimeOnPageTrend: number;
        goalCompletions: number;
        goalCompletionsTrend: number;
        avgPosition: number;
        avgPositionTrend: number;
        bounceRate: number;
        ur: number;
        dr: number;
        backlinks: number;
        referringDomains: number;
        keywords: number;
        trafficCost: number;
        paidTraffic: number;
        paidTrafficTrend: number;
        impressions: number;
        impressionsTrend: number;
        organicPages: number;
        crawledPages: number;
    } | {
        organicSessions: number;
        newUsers: number;
        avgTimeOnPage: number;
        organicSessionsTrend: number;
        newUsersTrend: number;
        goalCompletions: number;
        goalCompletionsTrend: number;
        avgPosition: number;
        avgPositionTrend: number;
        bounceRate: number;
        ur: number;
        dr: number;
        backlinks: number;
        referringDomains: number;
        keywords: number;
        trafficCost: number;
        paidTraffic: number;
        paidTrafficTrend: number;
        impressions: number;
        impressionsTrend: number;
        organicPages: number;
        crawledPages: number;
        avgTimeOnPageTrend?: undefined;
    }>;
    getHistory(user: any, days?: number): Promise<{
        date: string;
        organicTraffic: number;
        paidTraffic: number;
        paidTrafficCost: number;
        impressions: number;
        backlinks: any;
        referringDomains: any;
        keywords: any;
        trafficCost: any;
        avgPosition: number;
        dr: any;
        ur: any;
        organicPages: any;
        crawledPages: any;
        organicTrafficValue: any;
    }[]>;
    getKeywordIntent(user: any): Promise<{
        type: any;
        keywords: number;
        traffic: number;
        keywordsTrend: number;
        trafficTrend: number;
    }[]>;
    getTrafficByLocation(user: any): Promise<{
        country: string;
        city: string;
        traffic: number;
        keywords: number;
        countryCode: string;
    }[]>;
    getSeoOverview(tenantId: string, period?: string): Promise<{
        connected: {
            ga4: boolean;
            gsc: boolean;
        };
        dateRange: {
            from: string;
            to: string;
            days: number;
        };
        ga4: {
            activeUsers: number;
            newUsers: number;
            sessions: number;
            screenPageViews: number;
            engagementRateAvg: number;
            bounceRateAvg: number;
            avgSessionDurationAvg: number;
        };
        gsc: {
            siteUrl: string;
            clicks: number;
            impressions: number;
            ctr: number;
            positionAvg: number;
        };
    }>;
    getSeoDashboard(tenantId: string, period?: string, limit?: string): Promise<{
        overview: {
            connected: {
                ga4: boolean;
                gsc: boolean;
            };
            dateRange: {
                from: string;
                to: string;
                days: number;
            };
            ga4: {
                activeUsers: number;
                newUsers: number;
                sessions: number;
                screenPageViews: number;
                engagementRateAvg: number;
                bounceRateAvg: number;
                avgSessionDurationAvg: number;
            };
            gsc: {
                siteUrl: string;
                clicks: number;
                impressions: number;
                ctr: number;
                positionAvg: number;
            };
        };
        trends: {
            ga4: {
                date: string;
                activeUsers: number;
                newUsers: number;
                sessions: number;
                engagementRate: number;
                bounceRate: number;
                avgSessionDuration: number;
                screenPageViews: number;
            }[];
            gsc: any[];
        };
        top: {
            queries: any[];
            pages: any[];
            countries: any[];
            devices: any[];
        };
    }>;
    syncGsc(tenantId: string, days?: string): Promise<{
        success: boolean;
        message: string;
        fetched?: undefined;
        inserted?: undefined;
        dateRange?: undefined;
        siteUrl?: undefined;
    } | {
        success: boolean;
        fetched: number;
        inserted: number;
        dateRange: {
            from: string;
            to: string;
        };
        siteUrl: string;
        message?: undefined;
    }>;
    getTopKeywords(user: any): Promise<{
        keyword: string;
        position: number;
        volume: number;
        trafficPercent: number;
    }[]>;
    getOffpageSnapshots(user: any): Promise<{
        date: string;
        backlinks: number;
        referringDomains: number;
        ur: number;
        dr: number;
        organicTrafficValue: number;
    }[]>;
    getAnchorTexts(user: any): Promise<{
        text: string;
        referringDomains: number;
        totalBacklinks: number;
        dofollowBacklinks: number;
        traffic: number;
        trafficPercentage: number;
    }[]>;
    getAiInsights(user: any): Promise<{
        id: string;
        type: string;
        source: string;
        title: string;
        message: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        status: string;
        occurredAt: string;
        createdAt: string;
        updatedAt: string;
    }[]>;
}
