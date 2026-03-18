export interface AlertTriggerResponse {
    success: boolean;
    message?: string;
    alertsCreated?: number;
    alertsTriggered?: Array<{
        id: string;
        title: string;
        severity: string;
        campaignName?: string;
    }>;
    error?: string;
}
export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    error?: string;
}
export declare class BackendApiClient {
    private baseUrl;
    private timeoutMs;
    constructor(baseUrl?: string, timeoutMs?: number);
    triggerAlertCheck(token: string, tenantId: string, timeframe?: string): Promise<AlertTriggerResponse>;
    healthCheck(): Promise<boolean>;
    getBaseUrl(): string;
}
