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

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL_SUMMARY || 'https://suttipatrga.app.n8n.cloud/webhook/chat-summary';

export const aiSummaryService = {
    /**
     * Fetch full summary data including cards, insights, and sections
     */
    getFullSummary: async (): Promise<AiSummaryResponse> => {
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get-full-summary',
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch summary: ${response.statusText}`);
            }

            const responseData: any = await response.json();

            const safeData: AiSummaryResponse = {
                summaryCards: Array.isArray(responseData?.summaryCards) ? responseData.summaryCards : [],
                insight: {
                    title: responseData?.insight?.title ?? '',
                    message: responseData?.insight?.message ?? '',
                    recommendation: responseData?.insight?.recommendation ?? '',
                },
                sections: Array.isArray(responseData?.sections) ? responseData.sections : [],
            };

            return safeData;
        } catch (error) {
            console.error('Error fetching full summary:', error);
            throw error;
        }
    },

    /**
     * Fetch only summary cards data
     */
    getSummaryCards: async (): Promise<AiSummaryCard[]> => {
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get-summary-cards',
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch summary cards: ${response.statusText}`);
            }

            const data = await response.json();
            return data.summaryCards || [];
        } catch (error) {
            console.error('Error fetching summary cards:', error);
            throw error;
        }
    },
};
