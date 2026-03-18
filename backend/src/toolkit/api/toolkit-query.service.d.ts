import { PrismaService } from '../../modules/prisma/prisma.service';
import { GetAlertHistoryQueryDto, GetAlertsQueryDto, GetMetricsQueryDto } from './dto';
export declare class ToolkitQueryService {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    getMetrics(query: GetMetricsQueryDto): Promise<{
        metrics: unknown[];
        count: number;
    }>;
    getAlerts(query: GetAlertsQueryDto): Promise<{
        alerts: unknown[];
        count: number;
    }>;
    getAlertHistory(query: GetAlertHistoryQueryDto): Promise<{
        history: unknown[];
        count: number;
    }>;
}
