import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../../common/services/encryption.service';

@Injectable()
export class GoogleAnalyticsApiService {
    private readonly logger = new Logger(GoogleAnalyticsApiService.name);
    private oauth2Client;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly encryptionService: EncryptionService,
    ) {
        this.oauth2Client = new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_SECRET'),
        );
    }

    /**
     * Run a GA4 report with automatic token refresh and error handling
     */
    async runReport(account: any, requestBody: any) {
        try {
            const auth = await this.getAuthenticatedClient(account);

            const analyticsData = google.analyticsdata({
                version: 'v1beta',
                auth: auth
            });

            // TODO: Implement Rate Limiting / Quota Check here
            // this.checkQuota(account.propertyId);

            const response = await analyticsData.properties.runReport({
                property: `properties/${account.propertyId}`,
                requestBody: requestBody
            });

            return response.data;

        } catch (error) {
            this.handleApiError(error, account.propertyId);
        }
    }

    /**
     * Get authenticated OAuth2 client, refreshing token if needed
     */
    private async getAuthenticatedClient(account: any) {
        // Check if token needs refresh
        await this.refreshTokenIfNeeded(account);

        const auth = new google.auth.OAuth2(
            this.configService.get('GOOGLE_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_SECRET')
        );

        let accessToken = account.accessToken;
        let refreshToken = account.refreshToken;

        // Try decrypt if it looks encrypted (contains a colon)
        if (accessToken && accessToken.includes(':')) {
            try { accessToken = this.encryptionService.decrypt(accessToken); } catch(e) {}
        }
        if (refreshToken && refreshToken.includes(':')) {
            try { refreshToken = this.encryptionService.decrypt(refreshToken); } catch(e) {}
        }

        auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        return auth;
    }

    /**
     * Refresh access token if expired or about to expire
     */
    private async refreshTokenIfNeeded(account: any) {
        const now = new Date();
        // Refresh if no expiry date, or expired, or about to expire (within 5 mins), or if accessToken is placeholder
        if (!account.tokenExpiresAt || account.accessToken === 'placeholder' || (account.tokenExpiresAt.getTime() - now.getTime() < 5 * 60 * 1000)) {
            try {
                this.logger.log(`Refreshing GA4 token for account ${account.id}`);

                let refreshToken = account.refreshToken;
                if (refreshToken && refreshToken.includes(':')) {
                    try { refreshToken = this.encryptionService.decrypt(refreshToken); } catch(e) {}
                }

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Set refresh token on the main client instance to refresh
                this.oauth2Client.setCredentials({
                    refresh_token: refreshToken
                });

                const { credentials } = await this.oauth2Client.refreshAccessToken();

                if (!account.id) {
                    // In case account ID is missing (e.g. passed from Adapter using credentials object)
                    // we cannot save it to DB, but we can return it for this session.
                    account.accessToken = credentials.access_token;
                    if (credentials.expiry_date) account.tokenExpiresAt = new Date(credentials.expiry_date);
                    return;
                }

                // Update DB
                await this.prisma.googleAnalyticsAccount.update({
                    where: { id: account.id },
                    data: {
                        accessToken: this.encryptionService.encrypt(credentials.access_token),
                        tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null
                    }
                });

                // Update local object reference
                account.accessToken = this.encryptionService.encrypt(credentials.access_token);
                if (credentials.expiry_date) {
                    account.tokenExpiresAt = new Date(credentials.expiry_date);
                }

            } catch (error) {
                this.logger.error(`Failed to refresh GA4 token: ${error.message}`);
                throw new UnauthorizedException('Failed to refresh authentication token. Please reconnect GA4.');
            }
        }
    }

    /**
     * Centralized Error Handling
     */
    private handleApiError(error: any, propertyId: string) {
        this.logger.error(`GA4 API Error for property ${propertyId}: ${error.message}`);

        if (error.code === 401 || error.message?.includes('invalid_grant')) {
            throw new UnauthorizedException('Authentication failed. Please reconnect Google Analytics.');
        }

        if (error.code === 429 || error.message?.includes('quota')) {
            throw new BadRequestException('Google Analytics API quota exceeded. Please try again later.');
        }

        throw new BadRequestException(`Failed to fetch GA4 data: ${error.message}`);
    }
}
