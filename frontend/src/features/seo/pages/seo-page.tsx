import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SeoPremiumCards } from '../components/seo-premium-cards';
import { SeoSummaryCards } from '../components/seo-summary-cards';
import { TrafficByLocation } from '../components/traffic-by-location';
import { SeoPerformanceChart } from '../components/seo-performance-chart';
import { useSeoSummary } from '../hooks';
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus';
import { SeoMetricSummary } from '../types';
import { OrganicKeywordsByIntent } from '../components/organic-keywords-by-intent';
import { AdsConnectionStatus } from '../components/ads-connection-status';
import { SeoAnchorText } from '../components/seo-anchor-text';
import { TopOrganicKeywords } from '../components/top-organic-keywords';
import { SeoOffPageMetrics } from '../components/seo-offpage-metrics';

export function SeoPage() {
    const { data, isLoading } = useSeoSummary();
    const { status: integrationStatus, isLoading: integrationLoading, error: integrationError } = useIntegrationStatus();

    // Default fallback data if API fails or is loading (to prevent crash)
    const displayData: SeoMetricSummary = data || {
        organicSessions: 0,
        organicSessionsTrend: 0,
        goalCompletions: null,
        avgPosition: null,
        avgTimeOnPage: 0,
        avgTimeOnPageTrend: 0,
        bounceRate: 0,
        ur: null,
        dr: null,
        backlinks: null,
        referringDomains: null,
        keywords: null,
        trafficCost: null
    };


    return (
        <DashboardLayout>
            <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">SEO & Web Analytics</h1>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <AdsConnectionStatus
                                data={integrationStatus}
                                isLoading={integrationLoading}
                                error={integrationError ?? null}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground sm:text-base md:text-lg">
                            Track your organic search performance and website engagement.
                        </p>
                    </div>
                </div>

                {/* Standard Summary Cards */}
                <div className="w-full">
                    <SeoSummaryCards data={displayData} isLoading={isLoading} />
                </div>

                {/* Premium SEO Metrics (Ahrefs Style) */}
                <div className="w-full">
                    <SeoPremiumCards data={displayData} isLoading={isLoading} />
                </div>

                {/* Charts Area */}
                <div className="grid gap-4 grid-cols-1 sm:gap-6">
                    <div className="col-span-1">
                        <SeoPerformanceChart />
                    </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2 sm:gap-6">
                    <div className="col-span-1">
                        <TopOrganicKeywords />
                    </div>
                    <div className="col-span-1">
                        <TrafficByLocation isLoading={isLoading} />
                    </div>
                    <div className="col-span-1">
                        <OrganicKeywordsByIntent isLoading={isLoading} />
                    </div>
                    <div className="col-span-1">
                        <SeoAnchorText />
                    </div>
                </div>

                {/* Off-page Metrics */}
                <div className="w-full">
                    <SeoOffPageMetrics />
                </div>
            </div>
        </DashboardLayout>
    );
}
