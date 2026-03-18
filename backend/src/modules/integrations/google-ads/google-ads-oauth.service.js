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
var GoogleAdsOAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsOAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../../prisma/prisma.service");
const google_ads_client_service_1 = require("./services/google-ads-client.service");
const google_ads_campaign_service_1 = require("./google-ads-campaign.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const uuid_1 = require("uuid");
const unified_sync_service_1 = require("../../sync/unified-sync.service");
const client_1 = require("@prisma/client");
const encryption_service_1 = require("../../../common/services/encryption.service");
let GoogleAdsOAuthService = GoogleAdsOAuthService_1 = class GoogleAdsOAuthService {
    constructor(configService, prisma, googleAdsClientService, googleAdsCampaignService, unifiedSyncService, encryptionService, cacheManager) {
        this.configService = configService;
        this.prisma = prisma;
        this.googleAdsClientService = googleAdsClientService;
        this.googleAdsCampaignService = googleAdsCampaignService;
        this.unifiedSyncService = unifiedSyncService;
        this.encryptionService = encryptionService;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(GoogleAdsOAuthService_1.name);
    }
    createOAuthClient() {
        return new googleapis_1.google.auth.OAuth2(this.configService.get('GOOGLE_CLIENT_ID'), this.configService.get('GOOGLE_CLIENT_SECRET'), this.configService.get('GOOGLE_REDIRECT_URI_ADS'));
    }
    async generateAuthUrl(userId, tenantId) {
        const scopes = [
            'https://www.googleapis.com/auth/adwords',
        ];
        const state = Buffer.from(JSON.stringify({ userId, tenantId, timestamp: Date.now() })).toString('base64');
        const oauth2Client = this.createOAuthClient();
        const authUrl = oauth2Client.generateAuthUrl({
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
            const { userId, tenantId } = stateData;
            const oauth2Client = this.createOAuthClient();
            const { tokens } = await oauth2Client.getToken(code);
            try {
                if (tokens.refresh_token) {
                    this.logger.log(`[OAuth Trap] ✅ Received Refresh Token: ${tokens.refresh_token.substring(0, 5)}...`);
                }
                else {
                    this.logger.warn(`[OAuth Trap] ⚠️ WARNING: No refresh_token received! Google did not send one.`);
                }
            }
            catch (e) {
            }
            if (!tokens.access_token || !tokens.refresh_token) {
                throw new common_1.BadRequestException('Failed to get tokens from Google');
            }
            let selectableAccounts = [];
            try {
                selectableAccounts = await this.googleAdsClientService.getAllSelectableAccounts(tokens.refresh_token);
                this.logger.log(`Selectable Google Ads Accounts: ${JSON.stringify(selectableAccounts.map(a => a.id))}`);
            }
            catch (error) {
                this.logger.error(`Failed to list Google Ads accounts: ${error.message}`);
                throw new common_1.BadRequestException(`ไม่สามารถดึง Google Ads Accounts ได้: ${error.message}. กรุณาตรวจสอบว่า Developer Token ถูกต้องและ Google Ads API เปิดใช้งานแล้ว`);
            }
            if (!selectableAccounts || selectableAccounts.length === 0) {
                throw new common_1.BadRequestException('ไม่พบ Google Ads Account ที่เข้าถึงได้. กรุณาตรวจสอบว่าบัญชี Google นี้มีสิทธิ์เข้าถึง Google Ads Account');
            }
            const tempToken = (0, uuid_1.v4)();
            await this.cacheManager.set(`google_ads_temp_tokens:${tempToken}`, tokens, 600000);
            await this.cacheManager.set(`google_ads_temp_accounts:${tempToken}`, selectableAccounts, 600000);
            return {
                status: 'select_account',
                accounts: selectableAccounts,
                tempToken: tempToken,
            };
        }
        catch (error) {
            this.logger.error('Error in handleCallback:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`OAuth callback failed: ${error.message}`);
        }
    }
    async getTempAccounts(tempToken) {
        const accounts = await this.cacheManager.get(`google_ads_temp_accounts:${tempToken}`);
        if (!accounts) {
            throw new common_1.BadRequestException('Session expired or invalid token');
        }
        return accounts;
    }
    async completeConnection(tempToken, customerId, tenantId) {
        const tokens = await this.cacheManager.get(`google_ads_temp_tokens:${tempToken}`);
        if (!tokens || !tokens.refresh_token) {
            throw new common_1.BadRequestException('Session expired or invalid token');
        }
        const refreshToken = tokens.refresh_token;
        const accessToken = tokens.access_token;
        const tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
        const cachedAccounts = await this.cacheManager.get(`google_ads_temp_accounts:${tempToken}`);
        const selectedAccount = cachedAccounts?.find(acc => acc.id === customerId);
        const accountName = selectedAccount?.name || `Account ${customerId}`;
        const parentMccId = selectedAccount?.parentMccId || null;
        const isMccAccount = selectedAccount?.type === 'MANAGER' ? true : false;
        const cleanCustomerId = customerId.replace('customers/', '');
        const existing = await this.prisma.googleAdsAccount.findFirst({
            where: { tenantId, customerId: cleanCustomerId }
        });
        let accountId;
        if (existing) {
            await this.prisma.googleAdsAccount.update({
                where: { id: existing.id },
                data: {
                    refreshToken: this.encryptionService.encrypt(refreshToken),
                    accountName,
                    loginCustomerId: parentMccId,
                    isMccAccount,
                    status: 'ENABLED',
                    updatedAt: new Date()
                }
            });
            accountId = existing.id;
        }
        else {
            const newAccount = await this.prisma.googleAdsAccount.create({
                data: {
                    customerId: cleanCustomerId,
                    accountName,
                    loginCustomerId: parentMccId,
                    isMccAccount,
                    refreshToken: this.encryptionService.encrypt(refreshToken),
                    status: 'ENABLED',
                    tenantId: tenantId,
                    accessToken: accessToken ? this.encryptionService.encrypt(accessToken) : 'placeholder',
                    tokenExpiresAt: tokenExpiresAt,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
            accountId = newAccount.id;
        }
        await this.cacheManager.del(`google_ads_temp_tokens:${tempToken}`);
        await this.cacheManager.del(`google_ads_temp_accounts:${tempToken}`);
        this.triggerInitialSync(accountId, tenantId);
        return { success: true, accountId };
    }
    async triggerInitialSync(accountId, tenantId) {
        try {
            this.logger.log(`[Initial Sync] Starting sync for account ${accountId}`);
            const syncLog = await this.prisma.syncLog.create({
                data: {
                    tenantId,
                    platform: client_1.AdPlatform.GOOGLE_ADS,
                    accountId,
                    syncType: 'INITIAL',
                    status: 'STARTED',
                    startedAt: new Date(),
                }
            });
            await this.unifiedSyncService.syncAccount(client_1.AdPlatform.GOOGLE_ADS, accountId, tenantId);
            await this.prisma.syncLog.update({
                where: { id: syncLog.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                }
            });
            this.logger.log(`[Initial Sync] Completed for account ${accountId}`);
        }
        catch (error) {
            this.logger.error(`[Initial Sync] Failed for account ${accountId}: ${error.message}`);
            try {
                await this.prisma.syncLog.updateMany({
                    where: { accountId, status: 'STARTED' },
                    data: {
                        status: 'FAILED',
                        errorMessage: error.message,
                        completedAt: new Date(),
                    }
                });
            }
            catch (e) {
                this.logger.error(`[Initial Sync] Failed to update SyncLog: ${e.message}`);
            }
        }
    }
    async saveClientAccounts(refreshToken, userId, tenantId, loginCustomerId) {
        try {
            try {
                const accessible = await this.googleAdsClientService.listAccessibleCustomers(refreshToken);
                this.logger.debug(`Accessible Customers for this user: ${JSON.stringify(accessible)}`);
            }
            catch (e) {
                this.logger.warn(`Failed to list accessible customers: ${e.message}`);
            }
            const clientAccounts = await this.googleAdsClientService.getClientAccounts(refreshToken, loginCustomerId);
            this.logger.log(`Found ${clientAccounts.length} client accounts for user ${userId}`);
            if (clientAccounts.length === 0) {
                return [];
            }
            const customerIds = clientAccounts.map(a => a.id);
            const existingAccounts = await this.prisma.googleAdsAccount.findMany({
                where: {
                    tenantId,
                    customerId: { in: customerIds },
                },
            });
            const existingMap = new Map(existingAccounts.map(a => [a.customerId, a]));
            const operations = [];
            for (const account of clientAccounts) {
                const existing = existingMap.get(account.id);
                if (existing) {
                    operations.push(this.prisma.googleAdsAccount.update({
                        where: { id: existing.id },
                        data: {
                            accountName: account.name,
                            loginCustomerId: loginCustomerId,
                            isMccAccount: false,
                            refreshToken: this.encryptionService.encrypt(refreshToken),
                            status: account.status,
                            updatedAt: new Date(),
                        },
                    }));
                }
                else {
                    operations.push(this.prisma.googleAdsAccount.create({
                        data: {
                            customerId: account.id,
                            accountName: account.name,
                            loginCustomerId: loginCustomerId,
                            isMccAccount: false,
                            refreshToken: this.encryptionService.encrypt(refreshToken),
                            status: account.status,
                            tenantId: tenantId,
                            accessToken: 'placeholder',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    }));
                }
            }
            const results = await this.prisma.$transaction(operations);
            this.logger.log(`Processed ${results.length} accounts (Created/Updated)`);
            return results;
        }
        catch (error) {
            this.logger.error('Failed to save client accounts:', error);
            throw new Error(`Failed to save client accounts: ${error.message}`);
        }
    }
    async getConnectedAccounts(tenantId) {
        const accounts = await this.prisma.googleAdsAccount.findMany({
            where: {
                tenantId,
            },
            select: {
                id: true,
                customerId: true,
                accountName: true,
                status: true,
                lastSyncAt: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return {
            success: true,
            accounts: accounts,
            count: accounts.length,
        };
    }
    async getAccessToken(tenantId, customerId) {
        const account = await this.prisma.googleAdsAccount.findFirst({
            where: {
                tenantId,
                customerId,
            },
        });
        if (!account) {
            throw new common_1.BadRequestException('Google Ads account not found');
        }
        const now = new Date();
        const expiryBuffer = 5 * 60 * 1000;
        if (!account.tokenExpiresAt || (account.tokenExpiresAt.getTime() - expiryBuffer) < now.getTime()) {
            this.logger.log(`[Token Refresh] Refreshing token for account ${customerId} (Expires: ${account.tokenExpiresAt})`);
            const oauth2Client = this.createOAuthClient();
            oauth2Client.setCredentials({
                refresh_token: this.encryptionService.decrypt(account.refreshToken),
            });
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                await this.prisma.googleAdsAccount.update({
                    where: { id: account.id },
                    data: {
                        accessToken: this.encryptionService.encrypt(credentials.access_token),
                        tokenExpiresAt: credentials.expiry_date
                            ? new Date(credentials.expiry_date)
                            : null,
                    },
                });
                return credentials.access_token;
            }
            catch (error) {
                this.logger.error(`[Token Refresh] Failed: ${error.message}`);
                throw error;
            }
        }
        return this.encryptionService.decrypt(account.accessToken);
    }
    async disconnect(tenantId) {
        await this.prisma.googleAdsAccount.deleteMany({
            where: { tenantId }
        });
        return true;
    }
};
exports.GoogleAdsOAuthService = GoogleAdsOAuthService;
exports.GoogleAdsOAuthService = GoogleAdsOAuthService = GoogleAdsOAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        google_ads_client_service_1.GoogleAdsClientService,
        google_ads_campaign_service_1.GoogleAdsCampaignService,
        unified_sync_service_1.UnifiedSyncService,
        encryption_service_1.EncryptionService, Object])
], GoogleAdsOAuthService);
//# sourceMappingURL=google-ads-oauth.service.js.map