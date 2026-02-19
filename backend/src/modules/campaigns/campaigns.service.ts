import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignsRepository } from './campaigns.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignsDto } from './dto';
import { Campaign, Metric, Prisma } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly repository: CampaignsRepository,
    private readonly auditLogsService: AuditLogsService,
  ) { }

  /**
   * Safely convert unknown value to number
   */
  private safe(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Parse string to Date, returns undefined if invalid
   */
  private toDate(s?: string): Date | undefined {
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  }

  /**
   * Create a new campaign
   */
  async create(tenantId: string, dto: CreateCampaignDto) {
    const campaign = await this.repository.create(tenantId, dto);

    await this.auditLogsService.createLog({
      action: 'CREATE_CAMPAIGN',
      resource: 'Campaign',
      details: { campaignId: campaign.id, name: campaign.name, platform: campaign.platform },
    });

    return this.normalizeCampaign(campaign);
  }

  /**
   * Find all campaigns with filtering, pagination, and TIME-WINDOW METRICS
   * 
   * When startDate/endDate are provided, metrics are filtered to that range.
   * This enables accurate "Last 7 Days" / "This Month" reporting.
   */
  async findAll(tenantId: string, query: QueryCampaignsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const take = limit;

    // Repository now handles date filtering for metrics
    const [items, total] = await this.repository.findAll(tenantId, query);

    // Normalize campaigns - metrics are already filtered by repository
    const normalized = items.map((c) => this.normalizeCampaign(c));

    return {
      data: normalized,
      meta: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
        // Include date range in meta for client awareness
        ...(query.startDate && { startDate: query.startDate }),
        ...(query.endDate && { endDate: query.endDate }),
      },
    };
  }

  /**
   * Find single campaign by ID
   */
  async findOne(tenantId: string, id: string) {
    const campaign = await this.repository.findOne(tenantId, id);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return this.normalizeCampaign(campaign);
  }

  /**
   * Update campaign
   */
  async update(tenantId: string, id: string, dto: UpdateCampaignDto) {
    // Check if campaign exists
    await this.findOne(tenantId, id);

    const data: Prisma.CampaignUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.platform !== undefined) {
      data.platform = dto.platform;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.budget !== undefined) {
      data.budget = dto.budget;
    }

    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }

    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    const campaign = await this.repository.update(tenantId, id, data);

    return this.normalizeCampaign(campaign);
  }

  /**
   * Remove (delete) campaign
   */
  async remove(tenantId: string, id: string) {
    // Check if campaign exists
    await this.findOne(tenantId, id);

    await this.repository.remove(tenantId, id);

    return { message: 'Campaign deleted successfully' };
  }

  /**
   * Get metrics for a single campaign with optional date range
   */
  async getCampaignMetrics(
    tenantId: string,
    id: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Check if campaign exists
    const campaign = await this.findOne(tenantId, id);

    const start = this.toDate(startDate);
    const end = this.toDate(endDate);

    const metrics = await this.repository.getMetrics(id, start, end);

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
      },
      metrics: metrics.map((m) => {
        const spend = this.safe(m.spend);
        const impressions = m.impressions ?? 0;
        const clicks = m.clicks ?? 0;

        return {
          date: m.date,
          impressions,
          clicks,
          spend,
          conversions: m.conversions,
          revenue: this.safe(m.revenue),
          // Calculated fields (Safe Math - not stored in DB):
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpc: clicks > 0 ? spend / clicks : 0,
          cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
          roas: this.safe(m.roas),
        };
      }),
    };
  }

  /**
   * Normalize campaign data with aggregated metrics
   * 
   * IMPORTANT: The metrics array is already filtered by the repository
   * when startDate/endDate query params are provided.
   * This ensures spend, impressions, etc. reflect the selected time window.
   */
  private normalizeCampaign(c: Campaign & { metrics: Metric[] }) {
    const m = c.metrics || [];

    // Aggregate metrics - these are already filtered by date range if provided
    const spend = m.reduce((s: number, x: Metric) => s + this.safe(x.spend), 0);
    const revenue = m.reduce((s: number, x: Metric) => s + this.safe(x.revenue), 0);
    const clicks = m.reduce((s: number, x: Metric) => s + this.safe(x.clicks), 0);
    const impressions = m.reduce((s: number, x: Metric) => s + this.safe(x.impressions), 0);
    const conversions = m.reduce((s: number, x: Metric) => s + this.safe(x.conversions), 0);

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      status: c.status,
      budget: this.safe(c.budget),
      startDate: c.startDate,
      endDate: c.endDate,
      externalId: c.externalId,
      // Aggregated metrics (time-window aware)
      spend,
      revenue,
      clicks,
      impressions,
      conversions,
      // Calculated ratios
      roas: spend ? Number((revenue / spend).toFixed(2)) : 0,
      ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
