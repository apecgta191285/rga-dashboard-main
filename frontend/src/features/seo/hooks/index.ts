// SEO Hooks exports
import { useQuery } from '@tanstack/react-query';
import { SeoService } from '../api';

export const SEO_KEYS = {
    all: ['seo'] as const,
    summary: () => [...SEO_KEYS.all, 'summary'] as const,
};

export function useSeoSummary() {
    return useQuery({
        queryKey: SEO_KEYS.summary(),
        queryFn: SeoService.getSummary,
    });
}
