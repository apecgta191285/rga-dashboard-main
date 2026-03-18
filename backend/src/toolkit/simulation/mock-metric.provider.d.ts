import { IMetricProvider } from '../services/alert-execution.service';
import { MetricSnapshot, BaselineSnapshot } from '../services/alert-engine.service';
import { SimulationContext } from './simulation-context';
export declare class MockMetricProvider implements IMetricProvider {
    private readonly context;
    private readonly rng;
    constructor(context: SimulationContext);
    fetchSnapshots(tenantId: string, dateRange: {
        start: Date;
        end: Date;
    }): Promise<MetricSnapshot[]>;
    fetchBaselines(tenantId: string, campaignIds: string[], baselineDateRange: {
        start: Date;
        end: Date;
    }): Promise<Map<string, BaselineSnapshot>>;
    private loadMetricFixtures;
    private loadBaselineFixtures;
    private generateDeterministicSnapshots;
    private generateCampaignSnapshot;
    private generateZeroConversionSnapshot;
    private generateDropSpendSnapshot;
    private generateHighRoasSnapshot;
    private generatePartialSnapshot;
    private generateDefaultSnapshot;
    private generateDeterministicBaseline;
    private applyOverrides;
    private validateAndNormalizeSnapshot;
    private validateAndNormalizeBaseline;
    private validateMetrics;
    private hashContext;
}
