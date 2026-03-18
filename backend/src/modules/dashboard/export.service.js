"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const metrics_service_1 = require("./metrics.service");
const csv_stringify_1 = require("csv-stringify");
const stream_1 = require("stream");
const pdfkit_1 = __importDefault(require("pdfkit"));
const UTF8_BOM = '\uFEFF';
const BATCH_SIZE = 500;
const CSV_COLUMNS = [
    { key: 'date', header: 'Date' },
    { key: 'campaignName', header: 'Campaign Name' },
    { key: 'platform', header: 'Platform' },
    { key: 'status', header: 'Status' },
    { key: 'spend', header: 'Spend ($)' },
    { key: 'impressions', header: 'Impressions' },
    { key: 'clicks', header: 'Clicks' },
    { key: 'ctr', header: 'CTR (%)' },
    { key: 'cpc', header: 'CPC ($)' },
];
const DANGEROUS_CSV_CHARS = /^[=+\-@\t\r]/;
const PDF_LAYOUT = {
    MARGIN: 50,
    COLUMN_WIDTHS: {
        COL1: 50,
        COL2: 200,
        COL3: 320,
        COL4: 440,
    },
    ROW_HEIGHT: 25,
};
let ExportService = ExportService_1 = class ExportService {
    constructor(prisma, metricsService) {
        this.prisma = prisma;
        this.metricsService = metricsService;
        this.logger = new common_1.Logger(ExportService_1.name);
    }
    async streamCampaignsCSV(tenantId, query) {
        const { startDate, endDate, platform, status } = query;
        this.logger.log(`Starting streaming CSV export for tenant ${tenantId} ` +
            `(${startDate.toISOString()} to ${endDate.toISOString()})`);
        const stringifier = (0, csv_stringify_1.stringify)({
            header: true,
            columns: CSV_COLUMNS,
        });
        const passThrough = new stream_1.PassThrough();
        passThrough.write(UTF8_BOM);
        stringifier.pipe(passThrough);
        this.streamDataInBackground(tenantId, startDate, endDate, platform, status, stringifier).catch((error) => {
            this.logger.error('Streaming export failed', error);
            stringifier.destroy(error);
        });
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        const filename = `campaigns-${startStr}-to-${endStr}.csv`;
        return new common_1.StreamableFile(passThrough, {
            type: 'text/csv; charset=utf-8',
            disposition: `attachment; filename="${filename}"`,
        });
    }
    async streamDataInBackground(tenantId, startDate, endDate, platform, status, stringifier) {
        let cursor;
        let hasMore = true;
        let totalRows = 0;
        try {
            while (hasMore) {
                const where = {
                    tenantId,
                    metrics: {
                        some: {
                            date: { gte: startDate, lte: endDate },
                        },
                    },
                };
                if (platform)
                    where.platform = platform;
                if (status)
                    where.status = status;
                const campaigns = await this.prisma.campaign.findMany({
                    where,
                    include: {
                        metrics: {
                            where: {
                                date: { gte: startDate, lte: endDate },
                            },
                        },
                    },
                    take: BATCH_SIZE,
                    ...(cursor && {
                        skip: 1,
                        cursor: { id: cursor },
                    }),
                    orderBy: { id: 'asc' },
                });
                for (const campaign of campaigns) {
                    const aggregated = this.aggregateMetrics(campaign.metrics);
                    stringifier.write({
                        date: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
                        campaignName: this.sanitizeCSVValue(campaign.name),
                        platform: campaign.platform,
                        status: campaign.status,
                        spend: aggregated.spend.toFixed(2),
                        impressions: aggregated.impressions,
                        clicks: aggregated.clicks,
                        ctr: aggregated.ctr.toFixed(2),
                        cpc: aggregated.cpc.toFixed(2),
                    });
                    totalRows++;
                }
                if (campaigns.length < BATCH_SIZE) {
                    hasMore = false;
                }
                else {
                    cursor = campaigns[campaigns.length - 1].id;
                }
            }
            this.logger.log(`Streaming export completed: ${totalRows} rows exported`);
        }
        finally {
            stringifier.end();
        }
    }
    aggregateMetrics(metrics) {
        const spend = metrics.reduce((sum, m) => sum + Number(m.spend || 0), 0);
        const impressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
        const clicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
        return {
            spend,
            impressions,
            clicks,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
        };
    }
    async exportMetricsToPDF(tenantId, period) {
        try {
            const trends = await this.metricsService.getMetricsTrends(tenantId, period, 'previous_period');
            const dailyMetrics = await this.metricsService.getDailyMetrics(tenantId, period);
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
            });
            const doc = new pdfkit_1.default({ margin: PDF_LAYOUT.MARGIN });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('Campaign Performance Report', { align: 'center' });
            doc.moveDown();
            doc
                .fontSize(12)
                .font('Helvetica')
                .text(`Tenant: ${tenant?.name ?? tenantId}`, { align: 'center' });
            doc.text(`Period: ${period === '7d' ? 'Last 7 Days' : 'Last 30 Days'}`, {
                align: 'center',
            });
            doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: 'center' });
            doc.moveDown(2);
            doc.fontSize(18).font('Helvetica-Bold').text('Summary');
            doc.moveDown();
            doc.fontSize(12).font('Helvetica');
            const current = trends?.current ?? {
                impressions: 0,
                clicks: 0,
                spend: 0,
                conversions: 0,
                revenue: 0,
                ctr: 0,
                roas: 0,
            };
            const previous = trends?.previous;
            const trendData = trends?.trends;
            const summary = [
                ['Metric', 'Current', 'Previous', 'Change'],
                [
                    'Impressions',
                    current.impressions.toLocaleString(),
                    previous?.impressions?.toLocaleString() ?? 'N/A',
                    trendData?.impressions != null
                        ? `${trendData.impressions > 0 ? '+' : ''}${trendData.impressions.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'Clicks',
                    current.clicks.toLocaleString(),
                    previous?.clicks?.toLocaleString() ?? 'N/A',
                    trendData?.clicks != null
                        ? `${trendData.clicks > 0 ? '+' : ''}${trendData.clicks.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'Spend',
                    `$${current.spend.toFixed(2)}`,
                    previous?.spend != null ? `$${previous.spend.toFixed(2)}` : 'N/A',
                    trendData?.spend != null
                        ? `${trendData.spend > 0 ? '+' : ''}${trendData.spend.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'Conversions',
                    current.conversions.toFixed(0),
                    previous?.conversions?.toFixed(0) ?? 'N/A',
                    trendData?.conversions != null
                        ? `${trendData.conversions > 0 ? '+' : ''}${trendData.conversions.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'Revenue',
                    `$${current.revenue.toFixed(2)}`,
                    previous?.revenue != null ? `$${previous.revenue.toFixed(2)}` : 'N/A',
                    trendData?.revenue != null
                        ? `${trendData.revenue > 0 ? '+' : ''}${trendData.revenue.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'CTR',
                    `${current.ctr.toFixed(2)}%`,
                    previous?.ctr != null ? `${previous.ctr.toFixed(2)}%` : 'N/A',
                    trendData?.ctr != null
                        ? `${trendData.ctr > 0 ? '+' : ''}${trendData.ctr.toFixed(1)}%`
                        : 'N/A',
                ],
                [
                    'ROAS',
                    current.roas.toFixed(2),
                    previous?.roas?.toFixed(2) ?? 'N/A',
                    trendData?.roas != null
                        ? `${trendData.roas > 0 ? '+' : ''}${trendData.roas.toFixed(1)}%`
                        : 'N/A',
                ],
            ];
            const tableTop = doc.y;
            const col1X = PDF_LAYOUT.COLUMN_WIDTHS.COL1;
            const col2X = PDF_LAYOUT.COLUMN_WIDTHS.COL2;
            const col3X = PDF_LAYOUT.COLUMN_WIDTHS.COL3;
            const col4X = PDF_LAYOUT.COLUMN_WIDTHS.COL4;
            const rowHeight = PDF_LAYOUT.ROW_HEIGHT;
            doc.font('Helvetica-Bold');
            doc.text(summary[0][0], col1X, tableTop);
            doc.text(summary[0][1], col2X, tableTop);
            doc.text(summary[0][2], col3X, tableTop);
            doc.text(summary[0][3], col4X, tableTop);
            doc.font('Helvetica');
            for (let i = 1; i < summary.length; i++) {
                const y = tableTop + i * rowHeight;
                doc.text(summary[i][0], col1X, y);
                doc.text(summary[i][1], col2X, y);
                doc.text(summary[i][2], col3X, y);
                doc.text(summary[i][3], col4X, y);
            }
            doc.moveDown(summary.length + 2);
            doc.fontSize(18).font('Helvetica-Bold').text('Daily Metrics');
            doc.moveDown();
            doc.fontSize(10).font('Helvetica');
            const dailyData = dailyMetrics?.data ?? [];
            if (dailyData.length === 0) {
                doc.text('No daily metrics available for this period.');
            }
            else {
                dailyData.slice(0, 10).forEach((day, index) => {
                    if (index > 0 && index % 5 === 0)
                        doc.moveDown();
                    doc.text(`${this.formatDateSafe(day?.date)}: ${(day?.clicks ?? 0).toLocaleString()} clicks, $${(day?.spend ?? 0).toFixed(2)} spend, ${day?.conversions ?? 0} conversions`);
                });
            }
            doc
                .fontSize(8)
                .font('Helvetica')
                .text('This report is generated automatically by RGA Dashboard', PDF_LAYOUT.MARGIN, doc.page.height - PDF_LAYOUT.MARGIN, { align: 'center' });
            doc.end();
            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
                doc.on('error', (err) => {
                    reject(err);
                });
            });
        }
        catch (error) {
            this.logger.error(`PDF Export failed for tenant ${tenantId}`, error instanceof Error ? error.stack : error);
            throw new common_1.InternalServerErrorException('Failed to export metrics to PDF. Please try again later.');
        }
    }
    sanitizeCSVValue(value) {
        if (value == null) {
            return '';
        }
        const strValue = String(value);
        if (DANGEROUS_CSV_CHARS.test(strValue)) {
            return "'" + strValue;
        }
        return strValue;
    }
    formatDateSafe(date) {
        if (!date) {
            return 'N/A';
        }
        try {
            return date.toISOString().split('T')[0];
        }
        catch {
            return 'N/A';
        }
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = ExportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        metrics_service_1.MetricsService])
], ExportService);
//# sourceMappingURL=export.service.js.map