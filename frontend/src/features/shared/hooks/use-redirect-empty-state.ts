// src/features/shared/hooks/use-redirect-empty-state.ts
// =============================================================================
// Shared Empty State Hook - Redirect to Pricing for New Users
// =============================================================================

import { useCallback } from 'react';
import { useLocation } from 'wouter';

// =============================================================================
// Types
// =============================================================================

export interface RedirectEmptyStateResult {
    /** Handler to redirect to pricing section */
    redirectToPricing: () => void;
    /** Click handler wrapper for interactive elements */
    handleEmptyStateClick: (isEmpty: boolean) => (() => void) | undefined;
    /** Check if data is empty and return click handler */
    getEmptyStateProps: (isEmpty: boolean) => {
        onClick?: () => void;
        className?: string;
    };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Shared hook for handling empty state across all feature pages.
 * 
 * Usage:
 * - Campaigns: empty when campaigns.length === 0
 * - Data Sources: empty when no platforms connected
 * - AI Insights: empty when no AI data available
 * - SEO: empty when all metrics are 0/null
 * 
 * @returns RedirectEmptyStateResult with handlers
 * 
 * @example
 * ```tsx
 * const { getEmptyStateProps } = useRedirectEmptyState();
 * const isEmpty = campaigns.length === 0;
 * const emptyStateProps = getEmptyStateProps(isEmpty);
 * 
 * return (
 *   <div {...emptyStateProps}>
 *     <CampaignsTable campaigns={campaigns} />
 *   </div>
 * );
 * ```
 */
export function useRedirectEmptyState(): RedirectEmptyStateResult {
    const [, setLocation] = useLocation();

    const redirectToPricing = useCallback(() => {
        setLocation('/ecommerce-insights#pricing');
    }, [setLocation]);

    /**
     * Returns click handler only when in empty state
     */
    const handleEmptyStateClick = useCallback((isEmpty: boolean): (() => void) | undefined => {
        if (!isEmpty) return undefined;
        return redirectToPricing;
    }, [redirectToPricing]);

    /**
     * Returns props for empty state wrapper element
     */
    const getEmptyStateProps = useCallback((isEmpty: boolean): {
        onClick?: () => void;
        className?: string;
    } => {
        if (!isEmpty) return {};
        
        return {
            onClick: redirectToPricing,
            className: 'cursor-pointer',
        };
    }, [redirectToPricing]);

    return {
        redirectToPricing,
        handleEmptyStateClick,
        getEmptyStateProps,
    };
}

export default useRedirectEmptyState;
