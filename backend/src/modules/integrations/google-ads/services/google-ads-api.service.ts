import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleAdsClientService } from './google-ads-client.service';
import { EncryptionService } from '../../../../common/services/encryption.service';

@Injectable()
export class GoogleAdsApiService {
  private readonly logger = new Logger(GoogleAdsApiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleAdsClientService: GoogleAdsClientService,
    private readonly encryptionService: EncryptionService,
  ) { }

  /**
   * Helper: Decrypt refresh token
   */
  private decryptRefreshToken(encryptedToken: string): string {
    return this.encryptionService.decrypt(encryptedToken);
  }

  /**
   * Fetch campaigns using Raw REST (Axios) to ensure Hostinger compatibility
   */
  async fetchCampaigns(account: any) {
    if (!account.refreshToken) {
      throw new BadRequestException('Account not authenticated.');
    }

    const decryptedRefreshToken = this.decryptRefreshToken(account.refreshToken);

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type
      FROM campaign
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
      ORDER BY campaign.id
    `;

    try {
      this.logger.log(`[fetchCampaigns] Executing Raw REST query for account ${account.customerId}`);
      const results = await this.googleAdsClientService.rawRestQuery(
        account.customerId,
        decryptedRefreshToken,
        query,
        account.loginCustomerId
      );

      this.logger.log(`[fetchCampaigns] Successfully retrieved ${results.length} campaigns via REST.`);
      return results;
    } catch (error: any) {
      this.logger.error(`❌ Google Ads REST Error (fetching campaigns): ${error.message}`);
      throw new Error(`Failed to fetch campaigns via REST: ${error.message}`);
    }
  }

  /**
   * Fetch metrics using Raw REST (Axios)
   */
  async fetchCampaignMetrics(
    account: any,
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const decryptedRefreshToken = this.decryptRefreshToken(account.refreshToken);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Build REST compliant metrics query
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE campaign.id = '${campaignId}'
      AND segments.date >= '${startDateStr}'
      AND segments.date <= '${endDateStr}'
    `;

    try {
      this.logger.debug(`[fetchCampaignMetrics] Executing Raw REST query for campaign ${campaignId}`);
      const results = await this.googleAdsClientService.rawRestQuery(
        account.customerId,
        decryptedRefreshToken,
        query,
        account.loginCustomerId
      );

      this.logger.debug(`[fetchCampaignMetrics] Retrieved ${results.length} daily metric records via REST.`);
      return results;
    } catch (error: any) {
      this.logger.error(`❌ Google Ads REST Error (fetching metrics): ${error.message}`);
      throw new Error(`Failed to fetch metrics via REST: ${error.message}`);
    }
  }

  // Error handler (Simplified for now as we use Axios)
  private handleApiError(error: any, accountId: string, action: string) {
     this.logger.error(`[API-ERROR] Action: ${action}, Error: ${error.message}`);
  }
}
