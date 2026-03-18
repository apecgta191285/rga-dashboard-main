import { StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './metrics.service';
export interface ExportCampaignsQuery {
    startDate: Date;
    endDate: Date;
    platform?: string;
    status?: string;
}
export declare class ExportService {
    private readonly prisma;
    private readonly metricsService;
    private readonly logger;
    constructor(prisma: PrismaService, metricsService: MetricsService);
    streamCampaignsCSV(tenantId: string, query: ExportCampaignsQuery): Promise<StreamableFile>;
    private streamDataInBackground;
    private aggregateMetrics;
    exportMetricsToPDF(tenantId: string, period: '7d' | '30d'): Promise<Buffer>;
    private sanitizeCSVValue;
    private formatDateSafe;
}
