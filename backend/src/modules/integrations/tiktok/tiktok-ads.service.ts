import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketingPlatformAdapter, PlatformCredentials, DateRange } from '../common/marketing-platform.adapter';
import { Campaign, Metric, CampaignStatus, AdPlatform, Prisma } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class TikTokAdsService implements MarketingPlatformAdapter {
  private readonly logger = new Logger(TikTokAdsService.name);
  private readonly baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';

  constructor(private readonly configService: ConfigService) { }

  async validateCredentials(credentials: PlatformCredentials): Promise<boolean> {
    try {
      // Simple check: try to fetch advertiser info
      const response = await axios.get(`${this.baseUrl}/advertiser/get/`, {
        headers: {
          'Access-Token': credentials.accessToken,
        },
        params: {
          app_id: this.configService.get('TIKTOK_APP_ID'),
          advertiser_ids: JSON.stringify([credentials.accountId]),
        },
      });
      return response.data?.code === 0;
    } catch (error) {
      this.logger.error(`TikTok Credentials Validation Failed: ${error.message}`);
      return false;
    }
  }

  async fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/campaign/get/`, {
        headers: {
          'Access-Token': credentials.accessToken,
        },
        params: {
          advertiser_id: credentials.accountId,
          page_size: 1000,
        },
      });

      if (response.data?.code !== 0) {
        throw new Error(`TikTok API Error: ${response.data?.message}`);
      }

      const campaignList = response.data.data.list || [];
      const campaignIds = campaignList.map((c: any) => c.campaign_id);

      // 2. Fetch Absolute Lifetime Metrics for these campaigns
      // We use a very wide range to simulate "Lifetime"
      let lifetimeMetricsMap = new Map();
      if (campaignIds.length > 0) {
        try {
          const metricsResponse = await axios.get(`${this.baseUrl}/report/integrated/get/`, {
            headers: { 'Access-Token': credentials.accessToken },
            params: {
              advertiser_id: credentials.accountId,
              report_type: 'BASIC',
              data_level: 'AUCTION_CAMPAIGN',
              dimensions: JSON.stringify(['campaign_id']),
              metrics: JSON.stringify(['impressions', 'clicks', 'spend', 'conversion', 'total_conversion_value']),
              start_date: '2020-01-01',
              end_date: new Date().toISOString().split('T')[0],
              filters: JSON.stringify([{ field_name: 'campaign_ids', filter_type: 'IN', filter_value: campaignIds }]),
              page_size: 1000,
            },
          });
          if (metricsResponse.data?.code === 0) {
            const lifetimeList = metricsResponse.data.data.list || [];

            // DEBUG: Log sample lifetime metrics
            if (lifetimeList.length > 0) {
              this.logger.debug(`[TikTok Lifetime Metrics Sample] First row: ${JSON.stringify(lifetimeList[0], null, 2)}`);
              this.logger.debug(`[TikTok Lifetime Metrics] Metric keys: ${JSON.stringify(Object.keys(lifetimeList[0].metrics || {}))}`);
            }

            lifetimeList.forEach((row: any) => {
              this.logger.debug(`[TikTok Lifetime] Campaign ${row.dimensions.campaign_id}: spend=${row.metrics.spend}, impressions=${row.metrics.impressions}`);
              lifetimeMetricsMap.set(row.dimensions.campaign_id, row.metrics);
            });
          }
        } catch (e) {
          this.logger.warn(`Failed to fetch lifetime metrics for TikTok campaigns: ${e.message}`);
        }
      }

      return campaignList.map((c: any) => {
        // DEBUG: Log all budget-related fields
        this.logger.debug(`[TikTok Campaign Budget Debug] Campaign: ${c.campaign_id}`);
        this.logger.debug(`  budget: ${c.budget}, budget_amount: ${c.budget_amount}, lifetime_budget: ${c.lifetime_budget}, daily_budget: ${c.daily_budget}`);
        this.logger.debug(`  All campaign fields: ${JSON.stringify(c, null, 2)}`);

        let budget = parseFloat(c.budget || c.budget_amount || c.lifetime_budget || '0');
        const dailyBudget = parseFloat(c.daily_budget || '0');

        // If total budget is not set but we have daily budget + duration, calculate it
        if (budget <= 0 && dailyBudget > 0 && c.start_time && c.end_time) {
          const start = new Date(c.start_time);
          const end = new Date(c.end_time);
          const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          budget = dailyBudget * days;
        }

        this.logger.log(`[TikTok Budget Result] Campaign ${c.campaign_id}: budget=${budget}, dailyBudget=${dailyBudget}`);

        const metrics = lifetimeMetricsMap.get(c.campaign_id);
        if (metrics) {
          this.logger.debug(`[TikTok Metrics Debug] Campaign ${c.campaign_id} metrics: ${JSON.stringify(metrics)}`);
        }

        return {
          externalId: String(c.campaign_id || c.id || ''),
          name: c.campaign_name || c.name || '',
          status: this.mapStatus(c.operation_status || c.status),
          budget: new Prisma.Decimal(budget || dailyBudget || 0),
          startDate: c.start_time ? new Date(c.start_time) : null,
          endDate: c.end_time ? new Date(c.end_time) : null,
          platform: AdPlatform.TIKTOK,
          metrics: metrics ? {
            impressions: parseInt(metrics.impressions || '0'),
            clicks: parseInt(metrics.clicks || '0'),
            spend: parseFloat(metrics.spend || '0'),
            revenue: parseFloat(metrics.total_conversion_value || '0'),
            conversions: parseInt(metrics.conversion || '0'),
          } : undefined,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to fetch TikTok campaigns: ${error.message}`);
      throw error;
    }
  }

  async fetchMetrics(
    credentials: PlatformCredentials,
    campaignId: string,
    range: DateRange,
  ): Promise<Partial<Metric>[]> {
    try {
      // TikTok Reporting API
      const response = await axios.get(`${this.baseUrl}/report/integrated/get/`, {
        headers: {
          'Access-Token': credentials.accessToken,
        },
        params: {
          advertiser_id: credentials.accountId,
          report_type: 'BASIC',
          data_level: 'AUCTION_CAMPAIGN',
          dimensions: JSON.stringify(['campaign_id', 'stat_time_day']),
          metrics: JSON.stringify([
            'impressions',
            'clicks',
            'spend',
            'conversion',
            'total_conversion_value',
          ]),
          start_date: range.startDate.toISOString().split('T')[0],
          end_date: range.endDate.toISOString().split('T')[0],
          filters: JSON.stringify([
            {
              field_name: 'campaign_ids',
              filter_type: 'IN',
              filter_value: [campaignId],
            },
          ]),
          page_size: 1000,
        },
      });

      if (response.data?.code !== 0) {
        throw new Error(`TikTok API Error: ${response.data?.message}`);
      }

      const list = response.data.data.list || [];

      // DEBUG: Log sample metric row to see structure
      if (list.length > 0) {
        this.logger.debug(`[TikTok Metrics Sample] First metric row: ${JSON.stringify(list[0], null, 2)}`);
        this.logger.debug(`[TikTok Metrics Sample] All metric row fields keys: ${JSON.stringify(Object.keys(list[0].metrics || {}))}`);
      }

      return list.map((row: any, index: number) => {
        // DEBUG: Log spend parsing for each row
        const spendRaw = row.metrics.spend || row.metrics.stat_cost;
        this.logger.debug(`[TikTok Spend Debug] Row ${index}: spend_raw=${spendRaw}, type=${typeof spendRaw}`);

        const spend = parseFloat(spendRaw || '0');

        if (isNaN(spend)) {
          this.logger.warn(`[TikTok Spend NaN] Row ${index}: parseFloat returned NaN for value "${spendRaw}". All metrics: ${JSON.stringify(row.metrics)}`);
        }

        const revenue = parseFloat(
          row.metrics.total_conversion_value ||
          row.metrics.conversion_value ||
          row.metrics.total_conversions_value ||
          '0'
        );

        const result = {
          date: new Date(row.dimensions.stat_time_day),
          impressions: parseInt(row.metrics.impressions || '0'),
          clicks: parseInt(row.metrics.clicks || '0'),
          spend: new Prisma.Decimal(isNaN(spend) ? 0 : spend),
          conversions: parseInt(row.metrics.conversions || row.metrics.total_conversions || row.metrics.conversion || '0'),
          revenue: new Prisma.Decimal(revenue),
          roas: new Prisma.Decimal((isNaN(spend) || spend <= 0) ? 0 : revenue / spend),
        };

        if (index < 3) {
          this.logger.log(`[TikTok Metric Result] Date ${result.date}: spend=${result.spend}, impressions=${result.impressions}, clicks=${result.clicks}`);
        }

        return result;
      });
    } catch (error) {
      this.logger.error(`Failed to fetch TikTok metrics: ${error.message}`);
      return [];
    }
  }

  private mapStatus(status: string): CampaignStatus {
    switch (status?.toUpperCase()) {
      case 'ENABLE':
      case 'ENABLED':
      case 'ACTIVE':
        return CampaignStatus.ACTIVE;
      case 'DISABLE':
      case 'DISABLED':
      case 'PAUSED':
        return CampaignStatus.PAUSED;
      default:
        return CampaignStatus.PAUSED;
    }
  }
}
