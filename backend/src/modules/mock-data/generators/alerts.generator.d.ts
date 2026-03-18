import { AlertSeverity, AdPlatform } from '@prisma/client';
export type AlertType = 'LOW_ROAS' | 'CRITICAL_ROAS' | 'OVERSPEND' | 'NO_CONVERSIONS' | 'CTR_DROP' | 'INACTIVE_CAMPAIGN';
interface MockAlert {
    alertType: AlertType;
    severity: AlertSeverity;
    message: string;
    campaignName: string;
    platform: AdPlatform;
    value: number;
    threshold: number;
    isRead: boolean;
}
export declare const MOCK_ALERT_TEMPLATES: MockAlert[];
export declare function generateMockAlerts(count?: number): MockAlert[];
export declare function generateAlertForDB(tenantId: string, ruleId: string, template: MockAlert): {
    tenantId: string;
    ruleId: string;
    alertType: AlertType;
    severity: import(".prisma/client").$Enums.AlertSeverity;
    title: string;
    message: string;
    metadata: {
        campaignName: string;
        platform: import(".prisma/client").$Enums.AdPlatform;
        value: number;
        threshold: number;
    };
    status: "OPEN" | "ACKNOWLEDGED";
};
export {};
