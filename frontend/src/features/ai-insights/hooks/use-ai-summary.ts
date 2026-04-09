import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { aiSummaryService, AiSummaryCard } from '../services/ai-summary-service';
import { AiDetailSummaryData } from '../components/ai-detail-summary';

/**
 * Hook to fetch full summary data (cards, insights, sections)
 * Automatically refetches when component mounts and on value changes
 */
export function useAiSummary(): UseQueryResult<AiDetailSummaryData, Error> {
    return useQuery({
        queryKey: ['ai', 'summary', 'full'],
        queryFn: () => aiSummaryService.getFullSummary(),
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refetch every 60 seconds
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

/**
 * Hook to fetch only summary cards
 * Automatically refetches when component mounts and on value changes
 */
export function useAiSummaryCards(): UseQueryResult<AiSummaryCard[], Error> {
    return useQuery({
        queryKey: ['ai', 'summary', 'cards'],
        queryFn: () => aiSummaryService.getSummaryCards(),
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refetch every 60 seconds
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}
