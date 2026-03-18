import { AlertCondition } from '../services/alert-engine.service';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RuleScope = 'CAMPAIGN' | 'ACCOUNT';
export interface AlertRule {
    readonly id: string;
    readonly tenantId: string;
    readonly name: string;
    readonly description?: string;
    readonly enabled: boolean;
    readonly severity: AlertSeverity;
    readonly scope: RuleScope;
    readonly condition: AlertCondition;
    readonly metadata?: {
        readonly createdBy?: string;
        readonly createdAt?: string;
        readonly tags?: string[];
        readonly category?: string;
    };
}
export declare function createAlertRule(params: {
    tenantId: string;
    name: string;
    condition: AlertCondition;
    id?: string;
    description?: string;
    enabled?: boolean;
    severity?: AlertSeverity;
    scope?: RuleScope;
    metadata?: AlertRule['metadata'];
}): AlertRule;
export declare const SEVERITY_PRIORITY: Record<AlertSeverity, number>;
export declare function compareSeverity(a: AlertSeverity, b: AlertSeverity): number;
export declare function isSeverityAtLeast(severity: AlertSeverity, minimum: AlertSeverity): boolean;
