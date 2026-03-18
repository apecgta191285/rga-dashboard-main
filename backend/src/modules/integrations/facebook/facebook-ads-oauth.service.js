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
var FacebookAdsOAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookAdsOAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const axios_1 = require("@nestjs/axios");
const cache_manager_1 = require("@nestjs/cache-manager");
const uuid_1 = require("uuid");
const rxjs_1 = require("rxjs");
const encryption_service_1 = require("../../../common/services/encryption.service");
let FacebookAdsOAuthService = FacebookAdsOAuthService_1 = class FacebookAdsOAuthService {
    constructor(prisma, configService, httpService, encryptionService, cacheManager) {
        this.prisma = prisma;
        this.configService = configService;
        this.httpService = httpService;
        this.encryptionService = encryptionService;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(FacebookAdsOAuthService_1.name);
        this.apiVersion = 'v18.0';
        this.appId = this.configService.get('FACEBOOK_APP_ID');
        this.appSecret = this.configService.get('FACEBOOK_APP_SECRET');
        this.redirectUri = this.configService.get('FACEBOOK_REDIRECT_URI');
    }
    async generateAuthUrl(userId, tenantId) {
        const state = (0, uuid_1.v4)();
        await this.cacheManager.set(`fb_auth_state:${state}`, { userId, tenantId }, 600000);
        const scopes = ['ads_management', 'ads_read', 'read_insights'];
        const url = new URL(`https://www.facebook.com/${this.apiVersion}/dialog/oauth`);
        url.searchParams.append('client_id', this.appId);
        url.searchParams.append('redirect_uri', this.redirectUri);
        url.searchParams.append('state', state);
        url.searchParams.append('scope', scopes.join(','));
        url.searchParams.append('response_type', 'code');
        return url.toString();
    }
    async handleCallback(code, state) {
        const storedState = await this.cacheManager.get(`fb_auth_state:${state}`);
        if (!storedState) {
            throw new common_1.BadRequestException('Invalid or expired state');
        }
        const tokenUrl = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`;
        const { data: tokenData } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(tokenUrl, {
            params: {
                client_id: this.appId,
                client_secret: this.appSecret,
                redirect_uri: this.redirectUri,
                code,
            },
        }));
        const shortLivedToken = tokenData.access_token;
        const longLivedToken = await this.exchangeForLongLivedToken(shortLivedToken);
        const accounts = await this.getAdAccounts(longLivedToken);
        const tempToken = (0, uuid_1.v4)();
        await this.cacheManager.set(`fb_temp_token:${tempToken}`, {
            accessToken: longLivedToken,
            accounts,
            userId: storedState.userId,
            tenantId: storedState.tenantId,
        }, 600000);
        return {
            status: 'success',
            tempToken,
        };
    }
    async exchangeForLongLivedToken(shortLivedToken) {
        const url = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: this.appId,
                client_secret: this.appSecret,
                fb_exchange_token: shortLivedToken,
            },
        }));
        return data.access_token;
    }
    async getAdAccounts(accessToken) {
        const url = `https://graph.facebook.com/${this.apiVersion}/me/adaccounts`;
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url, {
            params: {
                access_token: accessToken,
                fields: 'account_id,name,account_status',
            },
        }));
        return data.data;
    }
    async getTempAccounts(tempToken) {
        const data = await this.cacheManager.get(`fb_temp_token:${tempToken}`);
        if (!data) {
            throw new common_1.BadRequestException('Invalid or expired temp token');
        }
        return data.accounts;
    }
    async completeConnection(tempToken, accountId, tenantId) {
        const data = await this.cacheManager.get(`fb_temp_token:${tempToken}`);
        if (!data) {
            throw new common_1.BadRequestException('Invalid or expired temp token');
        }
        const selectedAccount = data.accounts.find((a) => a.account_id === accountId || a.id === accountId);
        if (!selectedAccount) {
            throw new common_1.BadRequestException('Invalid account selection');
        }
        const account = await this.prisma.facebookAdsAccount.create({
            data: {
                tenantId,
                accountId: selectedAccount.account_id || selectedAccount.id,
                accountName: selectedAccount.name,
                accessToken: this.encryptionService.encrypt(data.accessToken),
                status: 'ACTIVE',
            },
        });
        await this.cacheManager.del(`fb_temp_token:${tempToken}`);
        return account;
    }
    async getConnectedAccounts(tenantId) {
        return this.prisma.facebookAdsAccount.findMany({
            where: { tenantId },
        });
    }
    async disconnect(tenantId) {
        this.logger.log(`Disconnecting Facebook Ads for tenant: ${tenantId}`);
        await this.prisma.facebookAdsAccount.deleteMany({
            where: { tenantId },
        });
        return true;
    }
};
exports.FacebookAdsOAuthService = FacebookAdsOAuthService;
exports.FacebookAdsOAuthService = FacebookAdsOAuthService = FacebookAdsOAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        axios_1.HttpService,
        encryption_service_1.EncryptionService, Object])
], FacebookAdsOAuthService);
//# sourceMappingURL=facebook-ads-oauth.service.js.map