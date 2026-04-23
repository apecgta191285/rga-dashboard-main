import { apiClient } from '@/services/api-client';
import { AiDetailSummaryData } from '../components/ai-detail-summary';

export interface AiSummaryCard {
    label: string;
    value: string;
    delta: string;
    trend: 'up' | 'down' | 'flat';
    color?: string;
    bg?: string;
}

interface AiSummaryResponse extends AiDetailSummaryData { }

// Path relative to apiClient baseURL
const BACKEND_WEBHOOK_PATH = (import.meta.env.VITE_API_URL || '/api/v1') + '/ai/webhook/summary';

const normalizeSummaryResponse = (responseData: any) => {
    let payload = responseData;

    // Standard apiClient unwrap might have already done this, 
    // but AiWebhookController returns a custom structure.
    if (responseData?.success && responseData?.data) {
        payload = responseData.data;
    }

    if (Array.isArray(payload)) {
        payload = payload[0];
    }

    if (payload && typeof payload === 'object' && 'data' in payload && payload.data) {
        payload = payload.data;
    }

    if (Array.isArray(payload)) {
        payload = payload[0];
    }

    return {
        summaryCards: Array.isArray(payload?.summaryCards) ? payload.summaryCards : [],
        insight: {
            title: payload?.insight?.title ?? '',
            message: payload?.insight?.message ?? '',
            recommendation: payload?.insight?.recommendation ?? '',
        },
        sections: Array.isArray(payload?.sections) ? payload.sections : [],
        raw: payload,
    };
};

export const aiSummaryService = {
    getFullSummary: async (tenantId: string, userId: string, message: string): Promise<AiSummaryResponse> => {
        const response = await apiClient.post(BACKEND_WEBHOOK_PATH, {
            userId,
            tenantId,
            message,
            timestamp: new Date().toISOString(),
        });

        const normalized = normalizeSummaryResponse(response.data);

        return {
            summaryCards: normalized.summaryCards,
            insight: normalized.insight,
            sections: normalized.sections,
        };
    },

    getSummaryCards: async (tenantId: string, userId: string, message: string): Promise<AiSummaryCard[]> => {
        const response = await apiClient.post(BACKEND_WEBHOOK_PATH, {
            userId,
            tenantId,
            message,
            timestamp: new Date().toISOString(),
        });

        const normalized = normalizeSummaryResponse(response.data);
        return normalized.summaryCards;
    },
};
