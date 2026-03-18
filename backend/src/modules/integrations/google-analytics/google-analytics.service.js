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
var GoogleAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const google_analytics_api_service_1 = require("./google-analytics-api.service");
let GoogleAnalyticsService = GoogleAnalyticsService_1 = class GoogleAnalyticsService {
    constructor(config, prisma, apiService) {
        this.config = config;
        this.prisma = prisma;
        this.apiService = apiService;
        this.logger = new common_1.Logger(GoogleAnalyticsService_1.name);
    }
    async getBasicMetrics(tenantId, startDate = '7daysAgo', endDate = 'today') {
        try {
            const hideMockData = process.env.HIDE_MOCK_DATA === 'true';
            const account = await this.prisma.googleAnalyticsAccount.findFirst({
                where: { tenantId, status: 'ACTIVE' },
            });
            if (!account) {
                this.logger.debug(`No active GA4 account found for tenant ${tenantId}`);
                return {
                    connected: false,
                    totals: null,
                    rows: [],
                    message: 'GA4 ยังไม่ได้เชื่อมต่อ'
                };
            }
            const days = this.parseDateRange(startDate);
            const startDateObj = new Date();
            startDateObj.setDate(startDateObj.getDate() - days);
            startDateObj.setHours(0, 0, 0, 0);
            const syncedData = await this.prisma.webAnalyticsDaily.findMany({
                where: {
                    tenantId,
                    propertyId: account.propertyId,
                    date: { gte: startDateObj },
                    ...(hideMockData ? { isMockData: false } : {}),
                },
                orderBy: { date: 'asc' }
            });
            if (syncedData.length > 0) {
                const totals = {
                    activeUsers: syncedData.reduce((sum, d) => sum + d.activeUsers, 0),
                    sessions: syncedData.reduce((sum, d) => sum + d.sessions, 0),
                    newUsers: syncedData.reduce((sum, d) => sum + d.newUsers, 0),
                    engagementRate: syncedData.reduce((sum, d) => sum + Number(d.engagementRate ?? 0), 0) / syncedData.length,
                };
                return {
                    connected: true,
                    isMockData: !hideMockData && syncedData.some(d => d.isMockData),
                    totals,
                    rows: syncedData.map(d => ({
                        date: d.date.toISOString().split('T')[0].replace(/-/g, ''),
                        activeUsers: d.activeUsers,
                        sessions: d.sessions,
                        newUsers: d.newUsers,
                        engagementRate: d.engagementRate,
                    })),
                };
            }
            this.logger.log(`Fetching GA4 data for property: ${account.propertyId}`);
            const response = await this.apiService.runReport(account, {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'sessions' },
                    { name: 'newUsers' },
                    { name: 'engagementRate' },
                ],
            });
            const result = this.transformResponse(response);
            return {
                connected: true,
                isMockData: false,
                ...result
            };
        }
        catch (error) {
            this.logger.error(`Failed to fetch GA4 data: ${error.message}`);
            return {
                connected: true,
                error: true,
                message: `ไม่สามารถดึงข้อมูล GA4 ได้: ${error.message}`,
                totals: null,
                rows: [],
            };
        }
    }
    parseDateRange(startDate) {
        if (startDate.includes('daysAgo')) {
            return parseInt(startDate.replace('daysAgo', '')) || 7;
        }
        return 7;
    }
    transformResponse(response) {
        const rows = response.rows || [];
        const totals = {
            activeUsers: 0,
            sessions: 0,
            newUsers: 0,
            engagementRate: 0,
        };
        rows.forEach((row) => {
            totals.activeUsers += Number(row.metricValues[0].value);
            totals.sessions += Number(row.metricValues[1].value);
            totals.newUsers += Number(row.metricValues[2].value);
        });
        if (rows.length > 0) {
            const totalEngagement = rows.reduce((acc, row) => acc + Number(row.metricValues[3].value), 0);
            totals.engagementRate = totalEngagement / rows.length;
        }
        return {
            totals,
            rows: rows.map((row) => ({
                date: row.dimensionValues[0].value,
                activeUsers: Number(row.metricValues[0].value),
                sessions: Number(row.metricValues[1].value),
                newUsers: Number(row.metricValues[2].value),
                engagementRate: Number(row.metricValues[3].value),
            })),
        };
    }
};
exports.GoogleAnalyticsService = GoogleAnalyticsService;
exports.GoogleAnalyticsService = GoogleAnalyticsService = GoogleAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        google_analytics_api_service_1.GoogleAnalyticsApiService])
], GoogleAnalyticsService);
//# sourceMappingURL=google-analytics.service.js.map