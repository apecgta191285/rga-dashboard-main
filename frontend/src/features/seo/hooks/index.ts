// SEO Hooks exports
import { useQuery } from '@tanstack/react-query';
import { SeoService } from '../api';
import { apiClient } from '@/services/api-client';

export const SEO_KEYS = {
    all: ['seo'] as const,
    summary: () => [...SEO_KEYS.all, 'summary'] as const,
    adsConnections: () => [...SEO_KEYS.all, 'ads-connections'] as const,
};

export function useSeoSummary(days?: number) {
    return useQuery({
        queryKey: [...SEO_KEYS.summary(), days],
        queryFn: () => SeoService.getSummary(days),
    });
}

export function useAdsConnections() {
    return useQuery({
        queryKey: SEO_KEYS.adsConnections(),
        queryFn: async () => {
            const response = await apiClient.get('/dashboard/ads-connections');
            return response.data;
        },
    });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSyncGsc() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (days?: number) => SeoService.syncGsc(days),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(`Successfully synced ${data.fetched} rows from Search Console`);
                queryClient.invalidateQueries({ queryKey: SEO_KEYS.all });
            } else {
                toast.error(data.message || 'Failed to sync GSC data');
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error connecting to GSC API');
        }
    });
}
