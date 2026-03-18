import { PrismaClient } from '@prisma/client';
import { GoogleAdsSeederService } from './google-ads-seeder.service';
import { AlertEngine, AlertCheckResult } from './alert-engine.service';
import { IProgressReporter } from './google-ads-seeder.service';
export interface AlertScenarioConfig {
    readonly tenantId: string;
    readonly days: number;
    readonly injectAnomaly: boolean;
    readonly autoCreateCampaigns: boolean;
}
export interface AnomalyConfig {
    readonly metric: 'spend' | 'conversions' | 'ctr' | 'roas';
    readonly type: 'SPIKE' | 'DROP' | 'ZERO';
    readonly magnitude: number;
}
export interface AlertScenarioResult {
    readonly success: boolean;
    readonly status: 'completed' | 'no_campaigns' | 'error';
    readonly message: string;
    readonly data?: {
        readonly tenantId: string;
        readonly seedResult: {
            readonly seededCount: number;
            readonly campaignCount: number;
            readonly dateRange: {
                readonly start: string;
                readonly end: string;
            };
        };
        readonly anomalyInjected: boolean;
        readonly alertCheck: AlertCheckResult;
    };
    readonly error?: string;
}
export declare class AlertScenarioService {
    private readonly seederService;
    private readonly alertEngine;
    private readonly prisma;
    constructor(seederService: GoogleAdsSeederService, alertEngine: AlertEngine, prisma: PrismaClient);
    execute(config: AlertScenarioConfig, progressReporter?: IProgressReporter): Promise<AlertScenarioResult>;
    assertSchemaParity(): Promise<void>;
    private injectAnomaly;
    private loadLatestSnapshots;
    private loadBaselines;
    private loadAlertRules;
    private mapMetricKey;
    private mapOperator;
    private mapSeverity;
    createSampleRule(type: 'high_spend' | 'zero_conversions' | 'low_roas'): import('./alert-engine.service').AlertRule;
}
