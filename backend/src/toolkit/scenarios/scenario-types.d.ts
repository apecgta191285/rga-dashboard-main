export interface ScenarioSpec {
    schemaVersion: '1.0.0';
    scenarioId: string;
    name: string;
    trend: 'STABLE' | 'GROWTH' | 'DECLINE' | 'SPIKE';
    baseImpressions?: number;
    days?: number;
    dateAnchor?: string;
    aliases?: string[];
}
export interface GoldenFixture {
    schemaVersion: '1.0.0';
    scenarioId: string;
    seed: number;
    generatedWith: {
        dateAnchor: string;
        days: number;
        baseImpressions: number;
        platforms: string[];
    };
    generatedAt: string;
    shape: {
        totalCampaigns: number;
        totalMetricRows: number;
        perPlatform: Record<string, {
            campaigns: number;
            metricRows: number;
        }>;
    };
    samples: FixtureSample[];
    checksum: string;
}
export interface FixtureSample {
    platform: string;
    dayIndex: number;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
}
