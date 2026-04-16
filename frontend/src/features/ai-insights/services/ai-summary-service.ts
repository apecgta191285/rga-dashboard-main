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

const BACKEND_WEBHOOK_URL = '/api/ai/webhook/summary';

const normalizeSummaryResponse = (responseData: any) => {
    let payload = responseData;

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
    getFullSummary: async (tenantId: string, message: string): Promise<AiSummaryResponse> => {
        const response = await fetch(BACKEND_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantId,
                message,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch summary: ${response.statusText}`);
        }

        const responseData: any = await response.json();
        const normalized = normalizeSummaryResponse(responseData);

        return {
            summaryCards: normalized.summaryCards,
            insight: normalized.insight,
            sections: normalized.sections,
        };
    },

    getSummaryCards: async (tenantId: string, message: string): Promise<AiSummaryCard[]> => {
        const response = await fetch(BACKEND_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantId,
                message,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch summary cards: ${response.statusText}`);
        }

        const responseData: any = await response.json();
        const normalized = normalizeSummaryResponse(responseData);
        return normalized.summaryCards;
    },
};
