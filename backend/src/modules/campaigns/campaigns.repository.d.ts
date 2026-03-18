import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, QueryCampaignsDto } from './dto';
import { Campaign, Metric, Prisma } from '@prisma/client';
export declare abstract class CampaignsRepository {
    abstract create(tenantId: string, data: CreateCampaignDto): Promise<Campaign & {
        metrics: Metric[];
    }>;
    abstract findAll(tenantId: string, query: QueryCampaignsDto): Promise<[(Campaign & {
        metrics: Metric[];
    })[], number]>;
    abstract findOne(tenantId: string, id: string): Promise<(Campaign & {
        metrics: Metric[];
    }) | null>;
    abstract update(tenantId: string, id: string, data: any): Promise<Campaign & {
        metrics: Metric[];
    }>;
    abstract remove(tenantId: string, id: string): Promise<void>;
    abstract getMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<Metric[]>;
    abstract getSummary(tenantId: string, query: QueryCampaignsDto): Promise<any>;
}
export declare class PrismaCampaignsRepository implements CampaignsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, dto: CreateCampaignDto): Promise<Campaign & {
        metrics: Metric[];
    }>;
    private buildWhereClause;
    findAll(tenantId: string, query: QueryCampaignsDto): Promise<[(Campaign & {
        metrics: Metric[];
    })[], number]>;
    findOne(tenantId: string, id: string): Promise<(Campaign & {
        metrics: Metric[];
    }) | null>;
    update(tenantId: string, id: string, data: any): Promise<Campaign & {
        metrics: Metric[];
    }>;
    remove(tenantId: string, id: string): Promise<void>;
    getMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<Metric[]>;
    getSummary(tenantId: string, query: QueryCampaignsDto): Promise<{
        _sum: {
            spend: number;
            impressions: number;
            clicks: number;
            revenue: number;
            conversions: number;
            budget: number;
        };
    } | {
        _sum: {
            budget: Prisma.Decimal;
            spend: Prisma.Decimal;
            impressions: number;
            clicks: number;
            revenue: Prisma.Decimal;
            conversions: number;
        };
    }>;
}
