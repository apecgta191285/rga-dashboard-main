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
var LineAdsOAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineAdsOAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
const encryption_service_1 = require("../../../common/services/encryption.service");
let LineAdsOAuthService = LineAdsOAuthService_1 = class LineAdsOAuthService {
    constructor(configService, prisma, encryptionService) {
        this.configService = configService;
        this.prisma = prisma;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(LineAdsOAuthService_1.name);
        this.authBaseUrl = 'https://access.line.me/oauth2/v2.1';
        this.channelId = this.configService.get('LINE_CHANNEL_ID');
        this.channelSecret = this.configService.get('LINE_CHANNEL_SECRET');
        this.redirectUri = this.configService.get('LINE_CALLBACK_URL');
        this.logger.log(`[LINE Ads OAuth] Initialized with Channel ID: ${this.channelId}, Redirect URI: ${this.redirectUri}`);
    }
    generateAuthUrl(userId, tenantId) {
        const state = Buffer.from(JSON.stringify({ userId, tenantId, timestamp: Date.now() })).toString('base64');
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.channelId,
            redirect_uri: this.redirectUri,
            state: state,
            scope: 'profile openid',
        });
        return `${this.authBaseUrl}/authorize?${params.toString()}`;
    }
    async handleCallback(code, state) {
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
            const { tenantId } = stateData;
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('code', code);
            params.append('redirect_uri', this.redirectUri);
            params.append('client_id', this.channelId);
            params.append('client_secret', this.channelSecret);
            const tokenResponse = await axios_1.default.post('https://api.line.me/oauth2/v2.1/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            const { access_token, refresh_token, id_token } = tokenResponse.data;
            const profileResponse = await axios_1.default.get('https://api.line.me/v2/profile', {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            const { userId: lineUserId, displayName } = profileResponse.data;
            const existing = await this.prisma.lineAdsAccount.findFirst({
                where: {
                    tenantId,
                    channelId: lineUserId,
                },
            });
            if (existing) {
                await this.prisma.lineAdsAccount.update({
                    where: { id: existing.id },
                    data: {
                        accessToken: this.encryptionService.encrypt(access_token),
                        channelName: displayName,
                        status: 'ACTIVE',
                        updatedAt: new Date(),
                    },
                });
            }
            else {
                await this.prisma.lineAdsAccount.create({
                    data: {
                        tenantId,
                        channelId: lineUserId,
                        channelName: displayName,
                        accessToken: this.encryptionService.encrypt(access_token),
                        status: 'ACTIVE',
                    },
                });
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error(`LINE Ads Callback Error: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to connect LINE Ads: ${error.message}`);
        }
    }
};
exports.LineAdsOAuthService = LineAdsOAuthService;
exports.LineAdsOAuthService = LineAdsOAuthService = LineAdsOAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], LineAdsOAuthService);
//# sourceMappingURL=line-ads-oauth.service.js.map