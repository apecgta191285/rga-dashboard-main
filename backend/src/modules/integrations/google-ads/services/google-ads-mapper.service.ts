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
                cost: (row.metrics?.costMicros || row.metrics?.cost_micros || 0) / 1000000, // Convert micros to dollars
                conversions: row.metrics?.conversions || 0,
                ctr: row.metrics?.ctr || 0,
            },
            budget: 0, // Initialize budget for type safety
        }));
        this.logger.log(`[transformCampaigns] Transformed to ${transformed.length} campaigns`);
        this.logger.log(`[transformCampaigns] Sample transformed: ${JSON.stringify(transformed.slice(0, 1), null, 2)}`);
        return transformed;
    }

    /**
     * Transform API metric results to internal format
     */
    transformMetrics(metrics: any[]) {
        if (!metrics || metrics.length === 0) {
            this.logger.warn('[transformMetrics] No metrics data provided');
            return [];
        }

        this.logger.debug(`[transformMetrics] Raw metric sample: ${JSON.stringify(metrics[0], null, 2)}`);

        return metrics.map((row: any) => {
            try {
                // Defensive: Handle missing nested structures
                const campaign = row.campaign || {};
                const segments = row.segments || {};
                const metrics = row.metrics || {};

                // Handle missing date field
                if (!segments.date && !segments.date_str) {
                    this.logger.warn(`[transformMetrics] Missing date field in row: ${JSON.stringify(row)}`);
                    return null; // Skip rows without dates
                }

                return {
                    date: new Date(segments.date || segments.date_str),
                    campaignId: (campaign.id || '').toString(),
                    campaignName: campaign.name || 'Unknown',
                    impressions: parseInt(metrics.impressions || '0'),
                    clicks: parseInt(metrics.clicks || '0'),
                    cost: (metrics.costMicros || metrics.cost_micros || 0) / 1000000, // Convert micros to currency
                    conversions: parseFloat(metrics.conversions || '0'),
                    conversionValue: parseFloat(metrics.conversionsValue || metrics.conversions_value || '0'),
                    ctr: parseFloat(metrics.ctr || '0') * 100, // Convert to percentage
                    cpc: (metrics.averageCpc || metrics.average_cpc || 0) / 1000000, // Convert micros to currency
                    cpm: 0, // CPM not available in this report type
                };
            } catch (error: any) {
                this.logger.error(`[transformMetrics] Error transforming metric row: ${error.message}`, JSON.stringify(row));
                return null;
            }
        }).filter(m => m !== null); // Filter out failed transformations
    }
}
