// SEO Hooks exports
import { useQuery } from '@tanstack/react-query';
import { SeoService } from '../api';
import { apiClient } from '@/services/api-client';

export const SEO_KEYS = {
    all: ['seo'] as const,
    summary: () => [...SEO_KEYS.all, 'summary'] as const,
    adsConnections: () => [...SEO_KEYS.all, 'ads-connections'] as const,
};

export function useSeoSummary() {
    return useQuery({
        queryKey: SEO_KEYS.summary(),
        queryFn: SeoService.getSummary,
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
