// src/features/dashboard/services/dashboard.service.ts
// =============================================================================
// Dashboard API Service - Type-Safe with Zod Validation
// =============================================================================

import { apiClient } from '@/services/api-client';
import {
    DashboardOverviewDataSchema,
    DashboardOverviewQuery,
    PeriodEnum,
    type DashboardOverviewData,
} from '../schemas';

// =============================================================================
// Service Configuration
// =============================================================================

const DASHBOARD_ENDPOINTS = {
    OVERVIEW: '/dashboard/overview',
} as const;

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetches dashboard overview data with runtime validation.
 *
 * @param params - Query parameters (period, tenantId)
 * @returns Validated DashboardOverviewData
 * @throws ZodError if response doesn't match schema
 * @throws AxiosError if network/auth fails
 *
 * @example
 * ```ts
 * const data = await getDashboardOverview({ period: '7d' });
 * console.log(data.summary.totalImpressions);
 * ```
 */
export async function getDashboardOverview(
    params: DashboardOverviewQuery = {}
): Promise<DashboardOverviewData> {
    const { period, tenantId, startDate, endDate } = params;

    const isCustomRange = Boolean(startDate && endDate);

    const response = await apiClient.get<DashboardOverviewData>(
        DASHBOARD_ENDPOINTS.OVERVIEW,
        {
            params: {
                ...(!isCustomRange && { period: period ?? 'this_month' }),
                ...(tenantId && { tenantId }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            },
        }
    );

    // ✅ Runtime validation using Zod
    // We wrap parse in try/catch so we can log the raw response when validation fails,
    // which helps debug NaN/invalid numeric values coming from the backend.
    try {
        const validatedData = DashboardOverviewDataSchema.parse(response.data);

        // Development-time sanity checks for numeric fields (catch non-finite values)
        if (import.meta.env.MODE === 'development') {
            const s = validatedData.summary;
            const badFields: string[] = [];
            const check = (v: any, name: string) => {
                if (!Number.isFinite(Number(v))) badFields.push(name);
            };

            check(s.totalCost, 'summary.totalCost');
            check(s.totalImpressions, 'summary.totalImpressions');
            check(s.totalClicks, 'summary.totalClicks');
            check(s.totalConversions, 'summary.totalConversions');
            check(s.averageCtr, 'summary.averageCtr');
            check(s.averageRoas, 'summary.averageRoas');
            check(s.averageCpm, 'summary.averageCpm');
            check(s.averageRoi, 'summary.averageRoi');

            if (badFields.length > 0) {
                // eslint-disable-next-line no-console
                console.warn('[getDashboardOverview] Non-finite numeric fields in summary:', {
                    badFields,
                    summary: s,
                    rawResponse: response.data,
                });

                // Also POST to local dev log server if available (non-blocking)
                try {
                    void fetch('http://localhost:9999/log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            level: 'warn',
                            message: 'Non-finite numeric fields in dashboard summary',
                            context: { badFields, summary: s, rawResponse: response.data },
                        }),
                    }).catch(() => { });
                } catch (e) {
                    // ignore
                }
            }
        }

        return validatedData;
    } catch (err) {
        // Log raw response to help backend debugging before rethrowing the validation error.
        // eslint-disable-next-line no-console
        console.error('[getDashboardOverview] Dashboard overview validation failed', {
            error: err,
            rawResponse: response?.data,
        });
        try {
            void fetch('http://localhost:9999/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: 'error',
                    message: 'Dashboard overview validation failed',
                    context: { error: String(err), rawResponse: response?.data },
                }),
            }).catch(() => { });
        } catch (e) {
            // ignore
        }
        throw err;
    }
}

// =============================================================================
// Service Object (Alternative Pattern for Grouping)
// =============================================================================

export const dashboardOverviewService = {
    /**
     * Get dashboard overview with default period
     */
    getOverview: getDashboardOverview,

    /**
     * Get overview for specific period
     */
    getOverviewByPeriod: (period: PeriodEnum) =>
        getDashboardOverview({ period }),

    /**
     * Get overview for specific tenant (SUPER_ADMIN only)
     */
    getOverviewByTenant: (tenantId: string, period: PeriodEnum = '7d') =>
        getDashboardOverview({ period, tenantId }),
} as const;

// Default export for convenience
export default dashboardOverviewService;
