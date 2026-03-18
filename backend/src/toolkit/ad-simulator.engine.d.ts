import { ToolkitPlatform } from './domain/platform.types';
export interface SimulationParams {
    date: Date;
    trendProfile: 'GROWTH' | 'DECLINE' | 'STABLE' | 'SPIKE';
    baseImpressions: number;
    dayIndex?: number;
    totalDays?: number;
    platform?: ToolkitPlatform;
}
export interface DailyMetrics {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    cvr: number;
    roas: number;
    aov: number;
}
export declare class AdSimulatorEngine {
    private readonly WEEKDAY_FACTOR;
    private readonly WEEKEND_FACTOR;
    private readonly MAX_GROWTH_RATE;
    private readonly MAX_DECLINE_RATE;
    private readonly DEFAULT_NOISE_VARIANCE;
    private readonly CTR_MIN;
    private readonly CTR_MAX;
    private readonly CPC_MIN;
    private readonly CPC_MAX;
    private readonly CVR_MIN;
    private readonly CVR_MAX;
    private readonly AOV_MIN;
    private readonly AOV_MAX;
    private getSeasonalityFactor;
    private applyTrend;
    private applyNoise;
    private applyFunnel;
    private roundToTwoDecimals;
    generateDailyMetrics(params: SimulationParams): DailyMetrics;
    generateDateRangeMetrics(startDate: Date, endDate: Date, trendProfile: 'GROWTH' | 'DECLINE' | 'STABLE' | 'SPIKE', baseImpressions: number, platform?: ToolkitPlatform): {
        date: Date;
        metrics: DailyMetrics;
    }[];
}
