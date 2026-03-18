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
var GoogleAdsApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsApiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../../../prisma/prisma.service");
const google_ads_client_service_1 = require("./google-ads-client.service");
const encryption_service_1 = require("../../../../common/services/encryption.service");
let GoogleAdsApiService = GoogleAdsApiService_1 = class GoogleAdsApiService {
    constructor(configService, prisma, googleAdsClientService, encryptionService) {
        this.configService = configService;
        this.prisma = prisma;
        this.googleAdsClientService = googleAdsClientService;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(GoogleAdsApiService_1.name);
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const developerToken = this.configService.get('GOOGLE_ADS_DEVELOPER_TOKEN');
        const mccLoginCustomerId = this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
        const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI_ADS');
        this.logger.log(`Initializing GoogleAdsApiService:`);
        this.logger.log(`- Client ID: ${clientId?.substring(0, 10)}...`);
        this.logger.log(`- Developer Token: ${developerToken ? 'SET' : '⚠️ MISSING'}`);
        this.logger.log(`- MCC Login Customer ID: ${mccLoginCustomerId || '⚠️ MISSING'}`);
        this.logger.log(`- Redirect URI: ${redirectUri}`);
        if (!developerToken) {
            this.logger.error('❌ CRITICAL: GOOGLE_ADS_DEVELOPER_TOKEN is not configured!');
        }
        if (!mccLoginCustomerId) {
            this.logger.warn('⚠️ WARNING: GOOGLE_ADS_LOGIN_CUSTOMER_ID is not configured. MCC-based access will fail.');
        }
    }
    createOAuthClient() {
        return new googleapis_1.google.auth.OAuth2(this.configService.get('GOOGLE_CLIENT_ID'), this.configService.get('GOOGLE_CLIENT_SECRET'), this.configService.get('GOOGLE_REDIRECT_URI_ADS'));
    }
    decryptRefreshToken(encryptedToken) {
        try {
            return this.encryptionService.decrypt(encryptedToken);
        }
        catch (error) {
            this.logger.error(`Failed to decrypt refresh token: ${error.message}`);
            throw new common_1.BadRequestException('Failed to decrypt token. Token may be corrupted.');
        }
    }
    async refreshTokenIfNeeded(account) {
        const now = new Date();
        const expiryBuffer = 5 * 60 * 1000;
        const shouldRefresh = !account.tokenExpiresAt ||
            account.tokenExpiresAt < now ||
            (account.tokenExpiresAt.getTime() - expiryBuffer) < now.getTime() ||
            !account.accessToken;
        if (shouldRefresh && account.refreshToken) {
            try {
                this.logger.log(`[Token Refresh] Checking status for account ${account.id}:`);
                this.logger.log(`- Now: ${now.toISOString()}`);
                this.logger.log(`- ExpiresAt: ${account.tokenExpiresAt ? account.tokenExpiresAt.toISOString() : 'NULL'}`);
                this.logger.log(`Refreshing token for account ${account.id}`);
                const decryptedRefreshToken = this.decryptRefreshToken(account.refreshToken);
                const oauth2Client = this.createOAuthClient();
                oauth2Client.setCredentials({
                    refresh_token: decryptedRefreshToken,
                });
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
                account.accessToken = this.encryptionService.encrypt(credentials.access_token);
                account.tokenExpiresAt = credentials.expiry_date
                    ? new Date(credentials.expiry_date)
                    : null;
                this.logger.log(`Token refreshed successfully for account ${account.id}`);
            }
            catch (error) {
                this.logger.error(`Failed to refresh token: ${error.message}`);
                throw new common_1.BadRequestException('Token expired and refresh failed. Please reconnect your Google Ads account.');
            }
        }
    }
    async fetchCampaigns(account) {
        if (!account || !account.refreshToken) {
            throw new Error('Google Ads account not found or not connected');
        }
        await this.refreshTokenIfNeeded(account);
        const decryptedRefreshToken = this.decryptRefreshToken(account.refreshToken);
        const customer = this.googleAdsClientService.getCustomer(account.customerId, decryptedRefreshToken, account.loginCustomerId);
        const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
      ORDER BY campaign.id
    `;
        try {
            this.logger.debug(`[fetchCampaigns] Querying Google Ads API for account ${account.customerId}`);
            const results = await customer.query(query);
            this.logger.log(`[fetchCampaigns] Retrieved ${results.length} campaigns`);
            return results;
        }
        catch (error) {
            this.logger.error(`Google Ads API Error: ${error.message}`);
            if (error.message?.includes('invalid_grant') || error.message?.includes('USER_PERMISSION_DENIED')) {
                this.logger.error(`[fetchCampaigns] DIAGNOSIS: invalid_grant or permission error detected.`);
                this.logger.error(`  - Customer ID: ${account.customerId}`);
                this.logger.error(`  - MCC Login ID: ${account.loginCustomerId || 'DIRECT ACCOUNT'}`);
                this.logger.error(`  - Possible causes:`);
                this.logger.error(`    1. Refresh token is expired/revoked`);
                this.logger.error(`    2. Token decryption failed`);
                this.logger.error(`    3. Login Customer ID does not have access to this child account`);
                try {
                    await this.prisma.googleAdsAccount.update({
                        where: { id: account.id },
                        data: { status: 'DISCONNECTED' }
                    });
                }
                catch (e) {
                    this.logger.error(`Failed to update account status to DISCONNECTED: ${e.message}`);
                }
            }
            throw new Error(`Failed to fetch campaigns: ${error.message}`);
        }
    }
    async fetchCampaignMetrics(account, campaignId, startDate, endDate) {
        if (!account.refreshToken) {
            throw new common_1.BadRequestException('Account not authenticated. Please reconnect your Google Ads account.');
        }
        await this.refreshTokenIfNeeded(account);
        try {
            const decryptedRefreshToken = this.decryptRefreshToken(account.refreshToken);
            const customer = this.googleAdsClientService.getCustomer(account.customerId, decryptedRefreshToken, account.loginCustomerId);
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            const metrics = await customer.query(`
        SELECT
          campaign.id,
          campaign.name,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign
        WHERE
          campaign.id = ${campaignId}
          AND campaign.status != 'REMOVED'
          AND segments.date >= '${startDateStr}'
          AND segments.date <= '${endDateStr}'
        ORDER BY segments.date ASC
      `);
            this.logger.log(`Fetched ${metrics.length} metric records`);
            return metrics;
        }
        catch (error) {
            this.handleApiError(error, account.id, campaignId);
            return [];
        }
    }
    handleApiError(error, accountId, campaignId) {
        this.logger.error('Raw Google Ads API Error:', JSON.stringify(error, null, 2));
        let errorMessage = 'Unknown error';
        let errorCode = null;
        if (error) {
            if (typeof error === 'string') {
                errorMessage = error;
            }
            else if (error.message) {
                errorMessage = error.message;
            }
            else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
                errorMessage = error.errors.map((e) => e.message).join(', ');
                errorCode = error.errors[0].errorCode;
            }
            else if (error.toString && error.toString() !== '[object Object]') {
                errorMessage = error.toString();
            }
            errorCode = errorCode || error.code || error.status || null;
            if (errorMessage === 'invalid_grant' || errorMessage.includes('USER_PERMISSION_DENIED')) {
                errorMessage = 'Token expired or invalid. Please reconnect your Google Ads account.';
                this.logger.warn(`Token expired for account ${accountId}. User needs to reconnect.`);
                this.logger.warn(`DIAGNOSIS: The token or loginCustomerId is invalid.`);
            }
            else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
                errorMessage = 'Permission denied. Please check account access permissions.';
            }
            else if (errorMessage.includes('developer_token')) {
                errorMessage = 'Invalid developer token. Please check GOOGLE_ADS_DEVELOPER_TOKEN.';
            }
            else if (errorMessage.includes('customer_id')) {
                errorMessage = 'Invalid customer ID. Please check customer ID format.';
            }
            else if (errorMessage.includes('login_customer_id')) {
                errorMessage = 'Invalid login customer ID (MCC). Please check GOOGLE_ADS_LOGIN_CUSTOMER_ID.';
            }
            else if (errorMessage.includes('decrypt')) {
                errorMessage = 'Token decryption failed. The stored token may be corrupted.';
            }
        }
        const descriptiveError = new Error(`Failed to fetch metrics: ${errorMessage}`);
        descriptiveError.code = errorCode;
        descriptiveError.originalError = error;
        throw descriptiveError;
    }
};
exports.GoogleAdsApiService = GoogleAdsApiService;
exports.GoogleAdsApiService = GoogleAdsApiService = GoogleAdsApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        google_ads_client_service_1.GoogleAdsClientService,
        encryption_service_1.EncryptionService])
], GoogleAdsApiService);
//# sourceMappingURL=google-ads-api.service.js.map