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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GoogleAnalyticsOAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAnalyticsOAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const uuid_1 = require("uuid");
const unified_sync_service_1 = require("../../sync/unified-sync.service");
const client_1 = require("@prisma/client");
const encryption_service_1 = require("../../../common/services/encryption.service");
let GoogleAnalyticsOAuthService = GoogleAnalyticsOAuthService_1 = class GoogleAnalyticsOAuthService {
    constructor(configService, prisma, cacheManager, unifiedSyncService, encryptionService) {
        this.configService = configService;
        this.prisma = prisma;
        this.cacheManager = cacheManager;
        this.unifiedSyncService = unifiedSyncService;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(GoogleAnalyticsOAuthService_1.name);
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(this.configService.get('GOOGLE_CLIENT_ID'), this.configService.get('GOOGLE_CLIENT_SECRET'), this.configService.get('GOOGLE_REDIRECT_URI_GA4'));
    }
    async generateAuthUrl(userId, tenantId) {
        const scopes = [
            'https://www.googleapis.com/auth/analytics.readonly',
        ];
        const state = Buffer.from(JSON.stringify({ userId, tenantId, timestamp: Date.now() })).toString('base64');
        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: state,
            prompt: 'consent',
        });
        return authUrl;
    }
    async handleCallback(code, state) {
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
            const { tenantId } = stateData;
            const { tokens } = await this.oauth2Client.getToken(code);
            if (!tokens.access_token || !tokens.refresh_token) {
                throw new common_1.BadRequestException('Failed to get tokens from Google');
            }
            const properties = await this.listProperties(tokens.access_token);
            const tempToken = (0, uuid_1.v4)();
            await this.cacheManager.set(`ga4_temp_token:${tempToken}`, tokens.refresh_token, 600000);
            await this.cacheManager.set(`ga4_temp_properties:${tempToken}`, properties, 600000);
            return {
                status: 'select_account',
                properties: properties,
                tempToken: tempToken,
            };
        }
        catch (error) {
            this.logger.error('Error in handleCallback:', error);
            throw new common_1.BadRequestException(`OAuth callback failed: ${error.message}`);
        }
    }
    async getTempProperties(tempToken) {
        const properties = await this.cacheManager.get(`ga4_temp_properties:${tempToken}`);
        if (!properties) {
            throw new common_1.BadRequestException('Session expired or invalid token');
        }
        return properties;
    }
    async completeConnection(tempToken, propertyId, tenantId) {
        const refreshToken = await this.cacheManager.get(`ga4_temp_token:${tempToken}`);
        if (!refreshToken) {
            throw new common_1.BadRequestException('Session expired or invalid token');
        }
        const cachedProperties = await this.cacheManager.get(`ga4_temp_properties:${tempToken}`);
        const selectedProperty = cachedProperties?.find(p => p.propertyId === propertyId);
        const propertyName = selectedProperty?.displayName || `Property ${propertyId}`;
        const existing = await this.prisma.googleAnalyticsAccount.findFirst({
            where: { tenantId, propertyId }
        });
        let accountId;
        if (existing) {
            await this.prisma.googleAnalyticsAccount.update({
                where: { id: existing.id },
                data: {
                    refreshToken: this.encryptionService.encrypt(refreshToken),
                    propertyName,
                    status: 'ACTIVE',
                    updatedAt: new Date()
                }
            });
            accountId = existing.id;
        }
        else {
            const newAccount = await this.prisma.googleAnalyticsAccount.create({
                data: {
                    tenantId,
                    propertyId,
                    propertyName,
                    refreshToken: this.encryptionService.encrypt(refreshToken),
                    accessToken: 'placeholder',
                    status: 'ACTIVE'
                }
            });
            accountId = newAccount.id;
        }
        await this.cacheManager.del(`ga4_temp_token:${tempToken}`);
        await this.cacheManager.del(`ga4_temp_properties:${tempToken}`);
        this.triggerInitialSync(accountId, tenantId);
        return { success: true, accountId };
    }
    async triggerInitialSync(accountId, tenantId) {
        try {
            this.logger.log(`[Initial Sync] Starting sync for GA4 account ${accountId}`);
            const syncLog = await this.prisma.syncLog.create({
                data: {
                    tenantId,
                    platform: client_1.AdPlatform.GOOGLE_ANALYTICS,
                    accountId,
                    syncType: client_1.SyncType.INITIAL,
                    status: client_1.SyncStatus.STARTED,
                    startedAt: new Date(),
                }
            });
            await this.unifiedSyncService.syncAccount(client_1.AdPlatform.GOOGLE_ANALYTICS, accountId, tenantId);
            await this.prisma.syncLog.update({
                where: { id: syncLog.id },
                data: {
                    status: client_1.SyncStatus.COMPLETED,
                    completedAt: new Date(),
                }
            });
            this.logger.log(`[Initial Sync] Completed for GA4 account ${accountId}`);
        }
        catch (error) {
            this.logger.error(`[Initial Sync] Failed for GA4 account ${accountId}: ${error.message}`);
        }
    }
    async listProperties(accessToken) {
        try {
            const auth = new googleapis_1.google.auth.OAuth2();
            auth.setCredentials({ access_token: accessToken });
            const analyticsAdmin = googleapis_1.google.analyticsadmin({
                version: 'v1beta',
                auth: auth
            });
            const accountSummaries = await analyticsAdmin.accountSummaries.list();
            const properties = [];
            if (accountSummaries.data.accountSummaries) {
                for (const account of accountSummaries.data.accountSummaries) {
                    if (account.propertySummaries) {
                        for (const prop of account.propertySummaries) {
                            properties.push({
                                propertyId: prop.property.split('/')[1],
                                displayName: prop.displayName
                            });
                        }
                    }
                }
            }
            this.logger.log(`Found ${properties.length} GA4 properties`);
            return properties;
        }
        catch (error) {
            this.logger.error(`Failed to list GA4 properties: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`ไม่สามารถดึง GA4 Properties ได้: ${error.message}. กรุณาตรวจสอบว่าเปิด Google Analytics Admin API ใน Google Cloud Console แล้ว`);
        }
    }
    async getConnectionStatus(tenantId) {
        const account = await this.prisma.googleAnalyticsAccount.findFirst({
            where: { tenantId, status: 'ACTIVE' },
            select: {
                id: true,
                propertyId: true,
                propertyName: true,
                status: true,
                createdAt: true,
            }
        });
        return {
            isConnected: !!account,
            account: account || null,
        };
    }
};
exports.GoogleAnalyticsOAuthService = GoogleAnalyticsOAuthService;
exports.GoogleAnalyticsOAuthService = GoogleAnalyticsOAuthService = GoogleAnalyticsOAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService, Object, unified_sync_service_1.UnifiedSyncService,
        encryption_service_1.EncryptionService])
], GoogleAnalyticsOAuthService);
//# sourceMappingURL=google-analytics-oauth.service.js.map