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
var GoogleAnalyticsAdapterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAnalyticsAdapterService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const google_analytics_api_service_1 = require("./google-analytics-api.service");
let GoogleAnalyticsAdapterService = GoogleAnalyticsAdapterService_1 = class GoogleAnalyticsAdapterService {
    constructor(apiService) {
        this.apiService = apiService;
        this.logger = new common_1.Logger(GoogleAnalyticsAdapterService_1.name);
    }
    async validateCredentials(credentials) {
        try {
            return !!credentials.accessToken;
        }
        catch (error) {
            this.logger.error(`Credential validation failed: ${error.message}`);
            return false;
        }
    }
    async fetchCampaigns(credentials) {
        return [];
    }
    async fetchMetrics(credentials, campaignId, range) {
        this.logger.log(`Fetching GA4 metrics for property ${credentials.accountId}`);
        try {
            const response = await this.apiService.runReport({
                propertyId: credentials.accountId,
                accessToken: credentials.accessToken,
                refreshToken: credentials.refreshToken,
            }, {
                dateRanges: [{
                        startDate: range.startDate.toISOString().split('T')[0],
                        endDate: range.endDate.toISOString().split('T')[0]
                    }],
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'sessions' },
                    { name: 'conversions' },
                    { name: 'totalRevenue' },
                ],
            });
            if (!response || !response.rows) {
                return [];
            }
            const metrics = response.rows.map((row) => {
                const revenue = Number(row.metricValues[3].value);
                return {
                    date: this.parseDate(row.dimensionValues[0].value),
                    impressions: Number(row.metricValues[0].value),
                    clicks: Number(row.metricValues[1].value),
                    conversions: Math.trunc(Number(row.metricValues[2].value)),
                    revenue: new client_1.Prisma.Decimal(revenue),
                    spend: new client_1.Prisma.Decimal(0),
                    roas: new client_1.Prisma.Decimal(0),
                };
            });
            return metrics;
        }
        catch (error) {
            this.logger.error(`Failed to fetch metrics: ${error.message}`);
            return [];
        }
    }
    parseDate(dateStr) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
    }
};
exports.GoogleAnalyticsAdapterService = GoogleAnalyticsAdapterService;
exports.GoogleAnalyticsAdapterService = GoogleAnalyticsAdapterService = GoogleAnalyticsAdapterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [google_analytics_api_service_1.GoogleAnalyticsApiService])
], GoogleAnalyticsAdapterService);
//# sourceMappingURL=google-analytics-adapter.service.js.map