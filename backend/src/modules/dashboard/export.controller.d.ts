import { ExportService } from './export.service';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportCampaigns(tenantId: string, startDateStr: string, endDateStr: string, platform?: string, status?: string): Promise<import("@nestjs/common").StreamableFile>;
    exportMetricsPDF(tenantId: string, period?: '7d' | '30d'): Promise<Buffer<ArrayBufferLike>>;
}
