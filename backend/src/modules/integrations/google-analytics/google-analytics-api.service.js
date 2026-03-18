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
var GoogleAnalyticsApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAnalyticsApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../../prisma/prisma.service");
let GoogleAnalyticsApiService = GoogleAnalyticsApiService_1 = class GoogleAnalyticsApiService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(GoogleAnalyticsApiService_1.name);
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(this.configService.get('GOOGLE_CLIENT_ID'), this.configService.get('GOOGLE_CLIENT_SECRET'));
    }
    async runReport(account, requestBody) {
        try {
            const auth = await this.getAuthenticatedClient(account);
            const analyticsData = googleapis_1.google.analyticsdata({
                version: 'v1beta',
                auth: auth
            });
            const response = await analyticsData.properties.runReport({
                property: `properties/${account.propertyId}`,
                requestBody: requestBody
            });
            return response.data;
        }
        catch (error) {
            this.handleApiError(error, account.propertyId);
        }
    }
    async getAuthenticatedClient(account) {
        await this.refreshTokenIfNeeded(account);
        const auth = new googleapis_1.google.auth.OAuth2(this.configService.get('GOOGLE_CLIENT_ID'), this.configService.get('GOOGLE_CLIENT_SECRET'));
        auth.setCredentials({
            access_token: account.accessToken,
            refresh_token: account.refreshToken
        });
        return auth;
    }
    async refreshTokenIfNeeded(account) {
        const now = new Date();
        if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
            try {
                this.logger.log(`Refreshing GA4 token for account ${account.id}`);
                this.oauth2Client.setCredentials({
                    refresh_token: account.refreshToken
                });
                const { credentials } = await this.oauth2Client.refreshAccessToken();
                await this.prisma.googleAnalyticsAccount.update({
                    where: { id: account.id },
                    data: {
                        accessToken: credentials.access_token,
                        tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
                    }
                });
                account.accessToken = credentials.access_token;
                if (credentials.expiry_date) {
                    account.tokenExpiresAt = new Date(credentials.expiry_date);
                }
            }
            catch (error) {
                this.logger.error(`Failed to refresh GA4 token: ${error.message}`);
                throw new common_1.UnauthorizedException('Failed to refresh authentication token. Please reconnect GA4.');
            }
        }
    }
    handleApiError(error, propertyId) {
        this.logger.error(`GA4 API Error for property ${propertyId}: ${error.message}`);
        if (error.code === 401 || error.message?.includes('invalid_grant')) {
            throw new common_1.UnauthorizedException('Authentication failed. Please reconnect Google Analytics.');
        }
        if (error.code === 429 || error.message?.includes('quota')) {
            throw new common_1.BadRequestException('Google Analytics API quota exceeded. Please try again later.');
        }
        throw new common_1.BadRequestException(`Failed to fetch GA4 data: ${error.message}`);
    }
};
exports.GoogleAnalyticsApiService = GoogleAnalyticsApiService;
exports.GoogleAnalyticsApiService = GoogleAnalyticsApiService = GoogleAnalyticsApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], GoogleAnalyticsApiService);
//# sourceMappingURL=google-analytics-api.service.js.map