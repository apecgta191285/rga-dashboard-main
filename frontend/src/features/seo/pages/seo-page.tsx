import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SeoPremiumCards } from '../components/seo-premium-cards';
import { SeoSummaryCards } from '../components/seo-summary-cards';
import { TrafficByLocation } from '../components/traffic-by-location';
import { SeoPerformanceChart } from '../components/seo-performance-chart';
import { useSeoSummary } from '../hooks';
import { SeoMetricSummary } from '../types';
import { OrganicKeywordsByIntent } from '../components/organic-keywords-by-intent';
import { SeoAnchorText } from '../components/seo-anchor-text';
import { TopOrganicKeywords } from '../components/top-organic-keywords';
import { SeoOffPageMetrics } from '../components/seo-offpage-metrics';
import { useRedirectEmptyState } from '@/features/shared/hooks/use-redirect-empty-state';

export function SeoPage() {
    const { data, isLoading } = useSeoSummary();

    // Empty State Detection - SEO is empty when all metrics are 0/null
    const { getEmptyStateProps } = useRedirectEmptyState();
    const isEmptyState = !isLoading && data && 
        data.organicSessions === 0 && 
        (data.keywords === null || data.keywords === 0);
    const emptyStateProps = getEmptyStateProps(isEmptyState || false);

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
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">SEO & Web Analytics</h1>
                        <p className="text-muted-foreground mt-1">
                            Track your organic search performance and website engagement.
                        </p>
                    </div>
                </div>

                {/* Standard Summary Cards */}
                <div {...emptyStateProps}>
                    <SeoSummaryCards data={displayData} isLoading={isLoading} />
                </div>

                {/* Premium SEO Metrics (Ahrefs Style) */}
                <div {...emptyStateProps}>
                    <SeoPremiumCards data={displayData} isLoading={isLoading} />
                </div>

                {/* Charts Area */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 items-start" {...emptyStateProps}>
                    <div className="col-span-5 space-y-6">
                        <SeoPerformanceChart />
                        <TopOrganicKeywords />
                    </div>
                    <div className="col-span-2 space-y-6">
                        <TrafficByLocation isLoading={isLoading} />
                        <OrganicKeywordsByIntent isLoading={isLoading} />
                        <SeoAnchorText />
                    </div>
                </div>

                {/* Off-page Metrics */}
                <div {...emptyStateProps}>
                    <SeoOffPageMetrics />
                </div>
            </div>
        </DashboardLayout>
    );
}
