import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { aiSummaryService, AiSummaryCard } from '../services/ai-summary-service';
import { AiDetailSummaryData } from '../components/ai-detail-summary';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook to fetch full summary data (cards, insights, sections)
 * Automatically refetches when component mounts and on value changes
 */
export function useAiSummary(enabled: boolean = true): UseQueryResult<AiDetailSummaryData, Error> {
    const user = useAuthStore((state) => state.user);
    const tenantId = user?.tenantId;

    return useQuery({
        queryKey: ['ai', 'summary', 'full', tenantId],
        queryFn: () => aiSummaryService.getFullSummary(
            tenantId ?? '',
            'Generate a daily dashboard summary'
        ),
        enabled: !!tenantId && enabled,
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
    const user = useAuthStore((state) => state.user);
    const tenantId = user?.tenantId;

    return useQuery({
        queryKey: ['ai', 'summary', 'cards', tenantId],
        queryFn: () => aiSummaryService.getSummaryCards(
            tenantId ?? '',
            'Get summary cards for the dashboard'
        ),
        enabled: !!tenantId,
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refetch every 60 seconds
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}
