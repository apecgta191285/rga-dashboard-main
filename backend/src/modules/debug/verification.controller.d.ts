import { VerificationSeeder } from '../mock-data/generators/verification-seeder';
import { AlertSchedulerService } from '../alerts/alert-scheduler.service';
export declare class VerificationController {
    private readonly verificationSeeder;
    private readonly alertSchedulerService;
    private readonly logger;
    constructor(verificationSeeder: VerificationSeeder, alertSchedulerService: AlertSchedulerService);
    private ensureNotProduction;
    seedHeavy(tenantId: string, count?: number): Promise<{
        success: boolean;
        tenantId: string;
        requested: number;
        insertedCampaigns: number;
        insertedMetrics: number;
        batchSize: number;
        metricsDaysPerCampaign: number;
        durationMs: number;
    }>;
    triggerAlertNow(email: string): Promise<any>;
    memoryCheck(): Promise<NodeJS.MemoryUsage>;
}
