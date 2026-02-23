// src/features/dashboard/hooks/use-empty-state.ts
// =============================================================================
// Empty State Detection Hook - For New Users Demo Mode
// =============================================================================

import { useMemo } from 'react';
import { useLocation } from 'wouter';
import type { DashboardOverviewData, SummaryMetrics } from '../schemas';

// =============================================================================
// Types
// =============================================================================

export interface EmptyStateResult {
    /** Whether all dashboard data is zero/empty */
    isEmpty: boolean;
    /** Handler to redirect to pricing section */
    redirectToPricing: () => void;
    /** Click handler wrapper for interactive elements */
    handleEmptyStateClick: (originalOnClick?: () => void) => (() => void) | undefined;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if summary metrics are all zero
 */
function isSummaryEmpty(summary: SummaryMetrics | undefined): boolean {
    if (!summary) return true;

    return (
        summary.totalCost === 0 &&
        summary.totalImpressions === 0 &&
        summary.totalClicks === 0 &&
        summary.totalConversions === 0
    );
}

/**
 * Check if all dashboard data is empty (for new users)
 */
export function isDashboardEmpty(data: DashboardOverviewData | undefined): boolean {
    if (!data) return true;

    const summaryEmpty = isSummaryEmpty(data.summary);
    const noCampaigns = !data.recentCampaigns || data.recentCampaigns.length === 0;
    const noTrends = !data.trends || data.trends.length === 0;

    return summaryEmpty && noCampaigns && noTrends;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to detect and handle empty state for new users.
 * 
 * When the dashboard has no data (new user), this hook provides:
 * - isEmpty flag to show demo/empty state UI
 * - redirectToPricing function to navigate to pricing section
 * - handleEmptyStateClick wrapper to intercept clicks
 * 
 * @param data - Dashboard overview data
 * @returns EmptyStateResult with flags and handlers
 * 
 * @example
 * ```tsx
 * const { isEmpty, handleEmptyStateClick } = useEmptyState(data);
 * 
 * return (
 *   <Chart
 *     onClick={handleEmptyStateClick(originalClickHandler)}
 *     className={isEmpty ? 'cursor-pointer' : ''}
 *   />
 * );
 * ```
 */
export function useEmptyState(data: DashboardOverviewData | undefined): EmptyStateResult {
    const [, setLocation] = useLocation();

    const isEmpty = useMemo(() => isDashboardEmpty(data), [data]);

    const redirectToPricing = () => {
        // Navigate to pricing section with hash for auto-scroll
        setLocation('/ecommerce-insights#pricing');
    };

    /**
     * Wraps an onClick handler to redirect to pricing when in empty state.
     * 
     * Usage:
     * - Pass the original onClick to preserve normal behavior when data exists
     * - Returns wrapped handler or undefined if no handler should be attached
     */
    const handleEmptyStateClick = (originalOnClick?: () => void): (() => void) | undefined => {
        // If we have data and an original handler, use the original
        if (!isEmpty && originalOnClick) {
            return originalOnClick;
        }

        // If we're in empty state, always redirect to pricing
        if (isEmpty) {
            return redirectToPricing;
        }

        // No handler needed
        return undefined;
    };

    return {
        isEmpty,
        redirectToPricing,
        handleEmptyStateClick,
    };
}

export default useEmptyState;
