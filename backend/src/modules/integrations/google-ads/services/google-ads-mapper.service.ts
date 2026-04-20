import { Injectable, Logger } from '@nestjs/common';
import { AdPlatform, CampaignStatus } from '@prisma/client';

@Injectable()
export class GoogleAdsMapperService {
    private readonly logger = new Logger(GoogleAdsMapperService.name);
    /**
     * Map Google Ads status string/number to internal CampaignStatus enum
     */
    mapCampaignStatus(status: string | number): CampaignStatus {
        const statusMap: Record<string, CampaignStatus> = {
            ENABLED: CampaignStatus.ACTIVE,
            PAUSED: CampaignStatus.PAUSED,
            REMOVED: CampaignStatus.DELETED,
            UNKNOWN: CampaignStatus.PAUSED,
            UNSPECIFIED: CampaignStatus.PAUSED,
            // also handle numeric status if provided by some libraries
            '2': CampaignStatus.ACTIVE,
            '3': CampaignStatus.PAUSED,
            '4': CampaignStatus.DELETED,
        };

        const statusStr = status.toString().toUpperCase();
        return statusMap[statusStr] || CampaignStatus.PAUSED;
    }

    /**
     * Transform API campaign results to internal format
     */
    transformCampaigns(results: any[]) {
        this.logger.log(`[transformCampaigns] Transforming ${results.length} raw results`);
        const transformed = results.map((row: any) => ({
            externalId: row.campaign.id.toString(),
            name: row.campaign.name,
            status: this.mapCampaignStatus(row.campaign.status),
            platform: AdPlatform.GOOGLE_ADS,
            channelType: row.campaign.advertisingChannelType || row.campaign.advertising_channel_type,
            metrics: {
                clicks: row.metrics?.clicks || 0,
                impressions: row.metrics?.impressions || 0,
                cost: (row.metrics?.costMicros || row.metrics?.cost_micros || 0) / 1000000,
                conversions: row.metrics?.conversions || 0,
                revenue: row.metrics?.conversionsValue || row.metrics?.conversions_value || 0,
                ctr: row.metrics?.ctr || 0,
            },
            budget: (() => {
              const b = row.campaignBudget || row.campaign_budget || row.budget;
              const totalMicros = Number(b?.totalAmountMicros || b?.total_amount_micros || 0);
              const dailyMicros = Number(b?.amountMicros || b?.amount_micros || 0);
              const micros = totalMicros || dailyMicros || 0;
              
              const start = row.campaign?.startDate || row.campaign?.start_date;
              const end = row.campaign?.endDate || row.campaign?.end_date;
              
              // If we have no total budget but we HAVE a daily budget and a duration, calculate it
              if (!totalMicros && dailyMicros && start && end && end !== '2037-12-30') {
                const startDate = new Date(start);
                const endDate = new Date(end);
                const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                return (dailyMicros * days) / 1000000;
              }
              
              return micros / 1000000;
            })(),
            startDate: (() => {
              const d = row.campaign?.startDate || row.campaign?.start_date;
              return d ? new Date(d) : null;
            })(),
            endDate: (() => {
              const d = row.campaign?.endDate || row.campaign?.end_date;
              return d ? new Date(d) : (d === '2037-12-30' ? null : null); // Google Ads uses 2037-12-30 for no end date
            })(),
        }));
        this.logger.log(`[transformCampaigns] Transformed to ${transformed.length} campaigns`);
        this.logger.log(`[transformCampaigns] Sample transformed: ${JSON.stringify(transformed.slice(0, 1), null, 2)}`);
        return transformed;
    }

    /**
     * Transform API metric results to internal format
     */
    transformMetrics(metrics: any[]) {
        return metrics.map((row: any) => ({
            date: new Date(row.segments.date),
            campaignId: row.campaign.id.toString(),
            campaignName: row.campaign.name,
            impressions: parseInt(row.metrics?.impressions || '0'),
            clicks: parseInt(row.metrics?.clicks || '0'),
            cost: (row.metrics?.costMicros || row.metrics?.cost_micros || 0) / 1000000, // Convert micros to currency
            conversions: parseFloat(row.metrics?.conversions || '0'),
            conversionValue: parseFloat(row.metrics?.conversionsValue || row.metrics?.conversions_value || '0'),
            ctr: parseFloat(row.metrics?.ctr || '0') * 100, // Convert to percentage
            cpc: (row.metrics?.averageCpc || row.metrics?.average_cpc || 0) / 1000000, // Convert micros to currency
            cpm: 0, // CPM not available in this report type
        }));
    }
}
