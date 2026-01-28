// src/features/dashboard/components/dashboard-date-filter.tsx
// =============================================================================
// Dashboard Date Filter - Period Selection Dropdown
// =============================================================================

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import type { PeriodEnum } from '../schemas';

// =============================================================================
// Types
// =============================================================================

export interface DashboardDateFilterProps {
    /** Currently selected period */
    value: PeriodEnum;
    /** Callback when period changes */
    onValueChange: (value: PeriodEnum) => void;
    /** Custom date range (for 'custom' period) */
    customRange?: { from: Date; to: Date };
    /** Callback when custom range changes */
    onCustomRangeChange?: (range: { from: Date; to: Date }) => void;
    /** Optional className */
    className?: string;
}

// =============================================================================
// Period Options
// =============================================================================

const PERIOD_OPTIONS: { value: PeriodEnum; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
];

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffDays(from: Date, to: Date) {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

function getPeriodFromPickedDate(pickedDate: Date, currentPeriod: PeriodEnum): PeriodEnum {
    const now = new Date();
    const today = startOfDay(now);
    const picked = startOfDay(pickedDate);

    const daysAgo = diffDays(picked, today);

    if (daysAgo >= 0 && daysAgo <= 6) return '7d';
    if (daysAgo >= 0 && daysAgo <= 29) return '30d';

    if (picked.getFullYear() === now.getFullYear() && picked.getMonth() === now.getMonth()) {
        return 'this_month';
    }

    const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const isPrevMonth =
        picked.getFullYear() === firstDayOfPrevMonth.getFullYear() &&
        picked.getMonth() === firstDayOfPrevMonth.getMonth();

    if (isPrevMonth) return 'last_month';

    return currentPeriod;
}

// =============================================================================
// Component
// =============================================================================

export function DashboardDateFilter({
    value,
    onValueChange,
    customRange,
    onCustomRangeChange,
    className,
}: DashboardDateFilterProps) {
    const [open, setOpen] = useState(false);
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
        from: customRange?.from,
        to: customRange?.to,
    });

    const selectedLabel = useMemo(() => {
        if (value === 'custom' && customRange) {
            return `${format(customRange.from, 'dd MMM')} - ${format(customRange.to, 'dd MMM')}`;
        }
        const match = PERIOD_OPTIONS.find((opt) => opt.value === value);
        return match?.label ?? value;
    }, [value, customRange]);

    const handleRangeSelect = (range?: { from?: Date; to?: Date }) => {
        if (!range?.from || !range?.to) {
            setDateRange(range || {});
            return;
        }

        setDateRange(range);
        onValueChange('custom');
        onCustomRangeChange?.({ from: range.from, to: range.to });
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={`h-8 w-[140px] px-2.5 text-xs justify-between ${className ?? ''}`}
                >
                    <span className="flex items-center min-w-0">
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{selectedLabel}</span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[340px] p-0 rounded-xl border border-border/60 shadow-lg max-h-[calc(100vh-6rem)] overflow-auto"
                align="start"
            >
                <div className="p-3">
                    <div className="space-y-2">
                        <div className="space-y-2">
                            <div className="text-[11px] font-medium text-muted-foreground">Period</div>
                            <Select
                                value={value}
                                onValueChange={(v) => {
                                    onValueChange(v as PeriodEnum);
                                    setOpen(false);
                                }}
                            >
                                <SelectTrigger className="h-8 w-full rounded-lg bg-background shadow-sm text-xs">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PERIOD_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-px bg-border" />

                        <div className="space-y-2">
                            <div className="text-[11px] font-medium text-muted-foreground">Date</div>
                            <div className="rounded-xl bg-background">
                                <Calendar
                                    mode="range"
                                    selected={dateRange as { from: Date; to?: Date } | undefined}
                                    onSelect={handleRangeSelect}
                                    captionLayout="dropdown"
                                    fromYear={new Date().getFullYear() - 1}
                                    toYear={new Date().getFullYear()}
                                    footer={
                                        dateRange?.from ? (
                                            <div className="px-2 pb-1 text-xs text-muted-foreground">
                                                {dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, 'PPP')} - {format(dateRange.to, 'PPP')}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, 'PPP')
                                                )}
                                            </div>
                                        ) : undefined
                                    }
                                    initialFocus
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default DashboardDateFilter;
