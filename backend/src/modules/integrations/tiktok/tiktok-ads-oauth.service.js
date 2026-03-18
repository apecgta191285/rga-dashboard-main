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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TikTokAdsOAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokAdsOAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const encryption_service_1 = require("../../../common/services/encryption.service");
let TikTokAdsOAuthService = TikTokAdsOAuthService_1 = class TikTokAdsOAuthService {
    constructor(configService, prisma, encryptionService, cacheManager) {
        this.configService = configService;
        this.prisma = prisma;
        this.encryptionService = encryptionService;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(TikTokAdsOAuthService_1.name);
        this.CACHE_TTL = 600000;
        this.appId = this.configService.get('TIKTOK_APP_ID');
        this.appSecret = this.configService.get('TIKTOK_APP_SECRET');
        this.redirectUri = this.configService.get('TIKTOK_REDIRECT_URI');
        this.useSandbox = this.configService.get('TIKTOK_USE_SANDBOX') === 'true';
        this.sandboxAccessToken = this.configService.get('TIKTOK_SANDBOX_ACCESS_TOKEN') || '';
        this.sandboxAdvertiserId = this.configService.get('TIKTOK_SANDBOX_ADVERTISER_ID') || '';
        if (this.useSandbox) {
            this.authUrl = 'https://sandbox-ads.tiktok.com/marketing_api/auth';
            this.tokenUrl = 'https://sandbox-ads.tiktok.com/open_api/v1.3/oauth2/access_token/';
            this.refreshUrl = 'https://sandbox-ads.tiktok.com/open_api/v1.3/oauth2/refresh_token/';
            this.apiBaseUrl = 'https://sandbox-ads.tiktok.com/open_api/v1.3';
        }
        else {
            this.authUrl = 'https://ads.tiktok.com/marketing_api/auth';
            this.tokenUrl = 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/';
            this.refreshUrl = 'https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/';
            this.apiBaseUrl = 'https://business-api.tiktok.com/open_api/v1.3';
        }
        this.logger.log(`[TikTok OAuth] Initialized - Sandbox: ${this.useSandbox}, App ID: ${this.appId?.substring(0, 8)}...`);
        if (this.useSandbox) {
            this.logger.warn('[TikTok OAuth] ⚠️ Running in SANDBOX mode');
        }
    }
    isSandboxMode() {
        return this.useSandbox;
    }
    async connectSandbox(tenantId) {
        if (!this.useSandbox) {
            throw new common_1.BadRequestException('Sandbox mode is not enabled. Set TIKTOK_USE_SANDBOX=true');
        }
        if (!this.sandboxAccessToken || !this.sandboxAdvertiserId) {
            throw new common_1.BadRequestException('Sandbox credentials not configured. Set TIKTOK_SANDBOX_ACCESS_TOKEN and TIKTOK_SANDBOX_ADVERTISER_ID in .env');
        }
        this.logger.log(`[TikTok OAuth] Connecting Sandbox account for tenant: ${tenantId}`);
        try {
            const existing = await this.prisma.tikTokAdsAccount.findFirst({
                where: {
                    tenantId,
                    advertiserId: this.sandboxAdvertiserId,
                },
            });
            let accountId;
            let accountName = 'TikTok Sandbox Account';
            if (existing) {
                await this.prisma.tikTokAdsAccount.update({
                    where: { id: existing.id },
                    data: {
                        accessToken: this.encryptionService.encrypt(this.sandboxAccessToken),
                        status: 'ACTIVE',
                        updatedAt: new Date(),
                    },
                });
                accountId = existing.id;
                accountName = existing.accountName;
                this.logger.log(`[TikTok OAuth] Updated Sandbox account: ${accountId}`);
            }
            else {
                const created = await this.prisma.tikTokAdsAccount.create({
                    data: {
                        tenantId,
                        advertiserId: this.sandboxAdvertiserId,
                        accountName,
                        accessToken: this.encryptionService.encrypt(this.sandboxAccessToken),
                        status: 'ACTIVE',
                    },
                });
                accountId = created.id;
                this.logger.log(`[TikTok OAuth] Created Sandbox account: ${accountId}`);
            }
            return { success: true, accountId, accountName };
        }
        catch (error) {
            this.logger.error(`[TikTok OAuth] Sandbox connection error: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to connect Sandbox account: ${error.message}`);
        }
    }
    generateAuthUrl(userId, tenantId) {
        const state = Buffer.from(JSON.stringify({ userId, tenantId, timestamp: Date.now() })).toString('base64');
        const params = new URLSearchParams({
            app_id: this.appId,
            state: state,
            redirect_uri: this.redirectUri,
        });
        const url = `${this.authUrl}?${params.toString()}`;
        this.logger.log(`[TikTok OAuth] Generated auth URL for user: ${userId}`);
        return url;
    }
    async handleCallback(code, state) {
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
            const { userId, tenantId } = stateData;
            this.logger.log(`[TikTok OAuth] Processing callback for tenant: ${tenantId}`);
            const tokenResponse = await axios_1.default.post(this.tokenUrl, {
                app_id: this.appId,
                secret: this.appSecret,
                auth_code: code,
            });
            if (tokenResponse.data?.code !== 0) {
                throw new common_1.BadRequestException(`TikTok token exchange failed: ${tokenResponse.data?.message || 'Unknown error'}`);
            }
            const { access_token, refresh_token, advertiser_ids } = tokenResponse.data.data;
            if (!advertiser_ids || advertiser_ids.length === 0) {
                throw new common_1.BadRequestException('No TikTok Advertiser accounts found. Please ensure your TikTok account has access to at least one advertiser.');
            }
            const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const accounts = await this.fetchAdvertiserDetails(access_token, advertiser_ids);
            const tempToken = (0, uuid_1.v4)();
            await this.cacheManager.set(`tiktok_temp_tokens:${tempToken}`, {
                accessToken: access_token,
                refreshToken: refresh_token,
                tokenExpiresAt,
                userId,
                tenantId,
            }, this.CACHE_TTL);
            await this.cacheManager.set(`tiktok_temp_accounts:${tempToken}`, accounts, this.CACHE_TTL);
            this.logger.log(`[TikTok OAuth] Found ${accounts.length} advertiser account(s)`);
            return {
                status: 'select_account',
                accounts,
                tempToken,
            };
        }
        catch (error) {
            this.logger.error(`[TikTok OAuth] Callback error: ${error.message}`);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to connect TikTok Ads: ${error.message}`);
        }
    }
    async fetchAdvertiserDetails(accessToken, advertiserIds) {
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/advertiser/info/`, {
                headers: {
                    'Access-Token': accessToken,
                },
                params: {
                    advertiser_ids: JSON.stringify(advertiserIds.map(id => String(id))),
                },
            });
            if (response.data?.code !== 0) {
                this.logger.warn(`[TikTok OAuth] Could not fetch advertiser details: ${response.data?.message}`);
                return advertiserIds.map(id => ({
                    id: String(id),
                    name: `TikTok Advertiser ${id}`,
                    status: 'UNKNOWN',
                }));
            }
            const advertisers = response.data.data.list || [];
            return advertisers.map((adv) => ({
                id: String(adv.advertiser_id),
                name: adv.name || adv.advertiser_name || `Advertiser ${adv.advertiser_id}`,
                status: adv.status || 'ACTIVE',
            }));
        }
        catch (error) {
            this.logger.warn(`[TikTok OAuth] Error fetching advertiser details: ${error.message}`);
            return advertiserIds.map(id => ({
                id: String(id),
                name: `TikTok Advertiser ${id}`,
                status: 'UNKNOWN',
            }));
        }
    }
    async getTempAccounts(tempToken) {
        const accounts = await this.cacheManager.get(`tiktok_temp_accounts:${tempToken}`);
        if (!accounts) {
            throw new common_1.BadRequestException('Session expired or invalid token. Please restart the OAuth flow.');
        }
        return accounts;
    }
    async completeConnection(tempToken, accountId, tenantId) {
        const tokenData = await this.cacheManager.get(`tiktok_temp_tokens:${tempToken}`);
        if (!tokenData || !tokenData.accessToken) {
            throw new common_1.BadRequestException('Session expired or invalid token. Please restart the OAuth flow.');
        }
        const cachedAccounts = await this.cacheManager.get(`tiktok_temp_accounts:${tempToken}`);
        const selectedAccount = cachedAccounts?.find(acc => acc.id === accountId);
        const accountName = selectedAccount?.name || `TikTok Advertiser ${accountId}`;
        this.logger.log(`[TikTok OAuth] Completing connection for advertiser: ${accountId}`);
        try {
            const existing = await this.prisma.tikTokAdsAccount.findFirst({
                where: {
                    tenantId,
                    advertiserId: accountId,
                },
            });
            let dbAccountId;
            if (existing) {
                await this.prisma.tikTokAdsAccount.update({
                    where: { id: existing.id },
                    data: {
                        accessToken: this.encryptionService.encrypt(tokenData.accessToken),
                        refreshToken: tokenData.refreshToken
                            ? this.encryptionService.encrypt(tokenData.refreshToken)
                            : null,
                        accountName,
                        status: 'ACTIVE',
                        updatedAt: new Date(),
                    },
                });
                dbAccountId = existing.id;
                this.logger.log(`[TikTok OAuth] Updated existing account: ${dbAccountId}`);
            }
            else {
                const created = await this.prisma.tikTokAdsAccount.create({
                    data: {
                        tenantId,
                        advertiserId: accountId,
                        accountName,
                        accessToken: this.encryptionService.encrypt(tokenData.accessToken),
                        refreshToken: tokenData.refreshToken
                            ? this.encryptionService.encrypt(tokenData.refreshToken)
                            : null,
                        status: 'ACTIVE',
                    },
                });
                dbAccountId = created.id;
                this.logger.log(`[TikTok OAuth] Created new account: ${dbAccountId}`);
            }
            await this.cacheManager.del(`tiktok_temp_tokens:${tempToken}`);
            await this.cacheManager.del(`tiktok_temp_accounts:${tempToken}`);
            return {
                success: true,
                accountId: dbAccountId,
                accountName,
            };
        }
        catch (error) {
            this.logger.error(`[TikTok OAuth] Complete connection error: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to save TikTok account: ${error.message}`);
        }
    }
    async refreshAccessToken(accountId, tenantId) {
        const account = await this.prisma.tikTokAdsAccount.findFirst({
            where: {
                id: accountId,
                tenantId,
            },
        });
        if (!account) {
            throw new common_1.BadRequestException('TikTok account not found');
        }
        if (!account.refreshToken) {
            throw new common_1.BadRequestException('No refresh token available. Please reconnect the TikTok account.');
        }
        const decryptedRefreshToken = this.encryptionService.decrypt(account.refreshToken);
        this.logger.log(`[TikTok OAuth] Refreshing token for account: ${accountId}`);
        try {
            const response = await axios_1.default.post(this.refreshUrl, {
                app_id: this.appId,
                secret: this.appSecret,
                refresh_token: decryptedRefreshToken,
            });
            if (response.data?.code !== 0) {
                throw new common_1.BadRequestException(`Token refresh failed: ${response.data?.message || 'Unknown error'}`);
            }
            const { access_token, refresh_token } = response.data.data;
            const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await this.prisma.tikTokAdsAccount.update({
                where: { id: accountId },
                data: {
                    accessToken: this.encryptionService.encrypt(access_token),
                    refreshToken: refresh_token
                        ? this.encryptionService.encrypt(refresh_token)
                        : account.refreshToken,
                    updatedAt: new Date(),
                },
            });
            this.logger.log(`[TikTok OAuth] Token refreshed successfully for account: ${accountId}`);
            return access_token;
        }
        catch (error) {
            this.logger.error(`[TikTok OAuth] Token refresh error: ${error.message}`);
            if (axios_1.default.isAxiosError(error) && error.response?.data) {
                throw new common_1.BadRequestException(`Token refresh failed: ${error.response.data.message || error.message}`);
            }
            throw new common_1.BadRequestException(`Token refresh failed: ${error.message}`);
        }
    }
    async getConnectedAccounts(tenantId) {
        const accounts = await this.prisma.tikTokAdsAccount.findMany({
            where: { tenantId },
            select: {
                id: true,
                advertiserId: true,
                accountName: true,
                status: true,
                lastSyncAt: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return accounts;
    }
    async disconnect(tenantId) {
        this.logger.log(`[TikTok OAuth] Disconnecting all accounts for tenant: ${tenantId}`);
        await this.prisma.tikTokAdsAccount.deleteMany({
            where: { tenantId },
        });
        return true;
    }
    async getAccessToken(accountId, tenantId) {
        const account = await this.prisma.tikTokAdsAccount.findFirst({
            where: {
                id: accountId,
                tenantId,
            },
        });
        if (!account) {
            throw new common_1.BadRequestException('TikTok account not found');
        }
        return this.encryptionService.decrypt(account.accessToken);
    }
};
exports.TikTokAdsOAuthService = TikTokAdsOAuthService;
exports.TikTokAdsOAuthService = TikTokAdsOAuthService = TikTokAdsOAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService, Object])
], TikTokAdsOAuthService);
//# sourceMappingURL=tiktok-ads-oauth.service.js.map