import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
    DATE_RANGE_OPTIONS,
    DATE_RANGE_LABELS,
    getDateRangeStrings,
    DEFAULT_DATE_RANGE,
} from '@/types/dateRange';

import type { DateRangeOption } from '@/types/dateRange';

interface DateRangeContextType {
    dateRange: DateRangeOption;
    setDateRange: (range: DateRangeOption) => void;
    dateRangeLabel: string;
    startDate: string;
    endDate: string;
    availableOptions: readonly DateRangeOption[];
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
    const [dateRange, setDateRange] = useState<DateRangeOption>(DEFAULT_DATE_RANGE);

    const { startDate, endDate } = getDateRangeStrings(dateRange);

    const value: DateRangeContextType = {
        dateRange,
        setDateRange,
        dateRangeLabel: DATE_RANGE_LABELS[dateRange],
        startDate,
        endDate,
        availableOptions: DATE_RANGE_OPTIONS,
    };

    return (
        <DateRangeContext.Provider value={value}>
            {children}
        </DateRangeContext.Provider>
    );
}

export function useDateRange() {
    const context = useContext(DateRangeContext);
    if (context === undefined) {
        throw new Error('useDateRange must be used within a DateRangeProvider');
    }
    return context;
}

// ✅ Re-export types for convenience
export type { DateRangeOption };
