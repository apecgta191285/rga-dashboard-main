import { PrismaService } from '../prisma/prisma.service';
import { AlertService } from './alert.service';
export declare class AlertSchedulerService {
    private readonly prisma;
    private readonly alertService;
    private readonly logger;
    constructor(prisma: PrismaService, alertService: AlertService);
    runScheduledAlertCheck(): Promise<void>;
    triggerAlertCheck(tenantId: string): Promise<any[]>;
    triggerAlertCheckForAllTenants(): Promise<{
        message: string;
    }>;
}
