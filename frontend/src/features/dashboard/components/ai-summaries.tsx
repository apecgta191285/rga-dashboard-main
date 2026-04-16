import { useState, useEffect } from 'react';
import type { GrowthMetrics, SummaryMetrics } from '../schemas';
import { formatCurrencyTHBDecimal } from '@/lib/formatters';
import { useAiSummaryCards } from '@/features/ai-insights/hooks/use-ai-summary';

type ItemKey = 'cpm' | 'ctr' | 'roas' | 'roi';

type SummaryItem = {
    key: ItemKey;
    label: string;
    value: string;
    delta: number | null | undefined;
    accentClassName: string;
};

function formatDelta(value: number | null | undefined) {
    if (value == null) return undefined;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

function deltaBadgeClassName(value: number | null | undefined) {
    if (value == null) return 'bg-slate-500/10 text-slate-500';
    return value >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';
}

// formatCurrencyTHBDecimal now imported from @/lib/formatters

export interface AiSummariesProps {
    summary?: SummaryMetrics;
    growth?: GrowthMetrics;
}

export function AiSummaries({ summary, growth }: AiSummariesProps) {
    const { data: webhookCards, isLoading, error } = useAiSummaryCards();
    const [displayedItems, setDisplayedItems] = useState<SummaryItem[]>([]);

    // When webhook data is fetched, convert it to displayedItems format
    useEffect(() => {
        if (webhookCards && webhookCards.length > 0) {
            // Use webhook data
            const webhookItems = webhookCards.map((card, index) => ({
                key: ['cpm', 'ctr', 'roas', 'roi'][index] as ItemKey,
                label: card.label,
                value: card.value,
                delta: parseFloat(card.delta),
                accentClassName: ['group-hover:text-blue-500', 'group-hover:text-emerald-500', 'group-hover:text-purple-500', 'group-hover:text-orange-500'][index] || '',
            }));
            setDisplayedItems(webhookItems);
        } else if (summary || growth) {
            // Fallback to original data
            const items: SummaryItem[] = [
                {
                    key: 'cpm',
                    label: 'CPM',
                    value: summary ? formatCurrencyTHBDecimal(summary.averageCpm) : formatCurrencyTHBDecimal(0),
                    delta: growth?.cpmGrowth,
                    accentClassName: 'group-hover:text-blue-500',
                },
                {
                    key: 'ctr',
                    label: 'CTR',
                    value: summary ? `${summary.averageCtr.toFixed(1)}%` : '0.0%',
                    delta: growth?.ctrGrowth,
                    accentClassName: 'group-hover:text-emerald-500',
                },
                {
                    key: 'roas',
                    label: 'ROAS',
                    value: summary ? `${summary.averageRoas.toFixed(1)}x` : '0.0x',
                    delta: growth?.roasGrowth,
                    accentClassName: 'group-hover:text-purple-500',
                },
                {
                    key: 'roi',
                    label: 'ROI',
                    value: summary ? `${summary.averageRoi.toFixed(0)}%` : '0%',
                    delta: growth?.roiGrowth,
                    accentClassName: 'group-hover:text-orange-500',
                },
            ];
            setDisplayedItems(items);
        }
    }, [webhookCards, summary, growth]);

    return (
        <div className="rounded-3xl border border-border bg-card p-4 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-semibold tracking-tight">AI Summaries</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Core metrics efficiency</p>
                </div>
            </div>

            {isLoading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-xl p-3 border border-border bg-card shadow-sm animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                            <div className="h-6 bg-muted rounded w-1/2 mb-1" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="rounded-xl p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    Failed to load summary data. Using cached data instead.
                </div>
            )}

            {!isLoading && displayedItems.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {displayedItems.map((item) => (
                        <div
                            key={item.key}
                            className="rounded-xl p-3 border border-border bg-card shadow-sm hover:border-muted-foreground/30 transition-all duration-300 hover:shadow-md cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p
                                    className={`text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors ${item.accentClassName}`}
                                >
                                    {item.label}
                                </p>
                                <span
                                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${deltaBadgeClassName(item.delta)}`}
                                >
                                    {formatDelta(item.delta) ?? '—'}
                                </span>
                            </div>
                            <p className="text-lg font-bold tracking-tight leading-none mb-1">{item.value}</p>
                            <p className="text-[11px] text-muted-foreground">From last period</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AiSummaries;
