import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignsDto } from './dto';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    create(req: any, createCampaignDto: CreateCampaignDto): Promise<{
        id: string;
        name: string;
        platform: import(".prisma/client").$Enums.AdPlatform;
        status: import(".prisma/client").$Enums.CampaignStatus;
        budget: number;
        startDate: Date;
        endDate: Date;
        externalId: string;
        spend: number;
        revenue: number;
        clicks: number;
        impressions: number;
        conversions: number;
        roas: number;
        roi: number;
        ctr: number;
        cpc: number;
        cpm: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(req: any, query: QueryCampaignsDto): Promise<{
        data: {
            id: string;
            name: string;
            platform: import(".prisma/client").$Enums.AdPlatform;
            status: import(".prisma/client").$Enums.CampaignStatus;
            budget: number;
            startDate: Date;
            endDate: Date;
            externalId: string;
            spend: number;
            revenue: number;
            clicks: number;
            impressions: number;
            conversions: number;
            roas: number;
            roi: number;
            ctr: number;
            cpc: number;
            cpm: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            endDate: string;
            startDate: string;
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        summary: {
            spend: number;
            budget: number;
            impressions: number;
            clicks: number;
            revenue: number;
            conversions: number;
            roas: number;
            roi: number;
            ctr: number;
            cpc: number;
            cpm: number;
        };
    }>;
    findOne(req: any, id: string): Promise<{
        id: string;
        name: string;
        platform: import(".prisma/client").$Enums.AdPlatform;
        status: import(".prisma/client").$Enums.CampaignStatus;
        budget: number;
        startDate: Date;
        endDate: Date;
        externalId: string;
        spend: number;
        revenue: number;
        clicks: number;
        impressions: number;
        conversions: number;
        roas: number;
        roi: number;
        ctr: number;
        cpc: number;
        cpm: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(req: any, id: string, updateCampaignDto: UpdateCampaignDto): Promise<{
        id: string;
        name: string;
        platform: import(".prisma/client").$Enums.AdPlatform;
        status: import(".prisma/client").$Enums.CampaignStatus;
        budget: number;
        startDate: Date;
        endDate: Date;
        externalId: string;
        spend: number;
        revenue: number;
        clicks: number;
        impressions: number;
        conversions: number;
        roas: number;
        roi: number;
        ctr: number;
        cpc: number;
        cpm: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(req: any, id: string): Promise<{
        message: string;
    }>;
    getMetrics(req: any, id: string, startDate?: string, endDate?: string): Promise<{
        campaign: {
            id: string;
            name: string;
            platform: import(".prisma/client").$Enums.AdPlatform;
        };
        metrics: {
            date: Date;
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            ctr: number;
            cpc: number;
            cpm: number;
            roas: number;
        }[];
    }>;
}
