import { PrismaClient } from '@prisma/client';
import { ILogger } from '../core/contracts';
import { ToolkitPlatform } from '../domain/platform.types';
export interface SeederConfig {
    readonly days: number;
    readonly platform: ToolkitPlatform;
    readonly seedSource: string;
}
export interface SeederResult {
    readonly success: boolean;
    readonly status: 'completed' | 'no_campaigns' | 'error';
    readonly message: string;
    readonly data?: {
        readonly tenantId: string;
        readonly tenantName: string;
        readonly seededCount: number;
        readonly campaignCount: number;
        readonly dateRange: {
            readonly start: string;
            readonly end: string;
        };
        readonly campaigns: ReadonlyArray<{
            readonly id: string;
            readonly name: string;
            readonly rowsCreated: number;
            readonly trendProfile: string;
        }>;
    };
    readonly error?: string;
}
export interface IProgressReporter {
    start(total: number, initialMessage?: string): void;
    update(current: number, message?: string): void;
    stop(): void;
}
export declare class NoOpProgressReporter implements IProgressReporter {
    start(): void;
    update(): void;
    stop(): void;
}
export declare class GoogleAdsSeederService {
    private readonly logger;
    private readonly prisma;
    private readonly engine;
    constructor(logger: ILogger, prisma: PrismaClient);
    seed(tenantId: string, config: SeederConfig, progressReporter?: IProgressReporter): Promise<SeederResult>;
    assertSchemaParity(): Promise<void>;
    private validateTenant;
    private calculateDateRange;
    private findCampaigns;
    private seedMetrics;
    private buildMetricRow;
    private toUtcDateOnly;
    private addUtcDays;
    private calculateDaysBetween;
    private getRandomTrendProfile;
    private randomBaseImpressions;
}
