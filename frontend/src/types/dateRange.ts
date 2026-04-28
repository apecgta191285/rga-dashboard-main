/**
 * Centralized DateRange Types
 *
 * Single source of truth for all date range related types.
 * Used by: DateRangeContext, Dashboard APIs, Analytics APIs
 *
 * @example
 * // Adding a new option in the future:
 * // 1. Add to DATE_RANGE_OPTIONS
 * // 2. Add label to DATE_RANGE_LABELS
 * // 3. Add date calculation to getDateRangeStrings
 */

export const DATE_RANGE_OPTIONS = [
    '1d',
    'yesterday',
    '7d',
    '14d',
    'this_month',
    'last_month',
    'last_3_months',
] as const;

// ✅ Type derived from the constant
export type DateRangeOption = typeof DATE_RANGE_OPTIONS[number];

// ✅ Human-readable labels for UI
export const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
    '1d': 'Today',
    'yesterday': 'Yesterday',
    '7d': 'Last 7 days',
    '14d': 'Last 14 days',
    'this_month': 'This month',
    'last_month': 'Last month',
    'last_3_months': 'Last 3 months',
};

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export const getDateRangeStrings = (
    option: DateRangeOption
): { startDate: string; endDate: string } => {
    const now = new Date();

    switch (option) {
        case '1d': {
            return {
                startDate: formatDate(now),
                endDate: formatDate(now),
            };
        }

        case 'yesterday': {
            const yesterday = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 1
            );

            return {
                startDate: formatDate(yesterday),
                endDate: formatDate(yesterday),
            };
        }

        case '7d': {
            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 6
            );

            return {
                startDate: formatDate(start),
                endDate: formatDate(now),
            };
        }

        case '14d': {
            const start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 13
            );

            return {
                startDate: formatDate(start),
                endDate: formatDate(now),
            };
        }

        case 'this_month': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);

            return {
                startDate: formatDate(start),
                endDate: formatDate(now),
            };
        }

        case 'last_month': {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);

            return {
                startDate: formatDate(start),
                endDate: formatDate(end),
            };
        }

        case 'last_3_months': {
            const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);

            return {
                startDate: formatDate(start),
                endDate: formatDate(end),
            };
        }
    }
};

// ✅ Default option
export const DEFAULT_DATE_RANGE: DateRangeOption = 'this_month';

// ✅ Type guard for validation
export const isValidDateRange = (value: string): value is DateRangeOption => {
    return DATE_RANGE_OPTIONS.includes(value as DateRangeOption);
};