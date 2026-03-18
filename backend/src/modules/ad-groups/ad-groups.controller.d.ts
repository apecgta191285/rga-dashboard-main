import { AdGroupsService } from './ad-groups.service';
import { CreateAdGroupDto, UpdateAdGroupDto, QueryAdGroupsDto } from './dto';
export declare class AdGroupsController {
    private readonly adGroupsService;
    constructor(adGroupsService: AdGroupsService);
    create(req: any, createAdGroupDto: CreateAdGroupDto): Promise<{
        budget: number;
        bidAmount: number;
        name: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AdGroupStatus;
        externalId: string | null;
        campaignId: string;
        bidType: string | null;
        targeting: import("@prisma/client/runtime/client").JsonValue | null;
        campaign?: unknown;
    }>;
    findAll(req: any, query: QueryAdGroupsDto): Promise<{
        data: {
            budget: number;
            bidAmount: number;
            name: string;
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.AdGroupStatus;
            externalId: string | null;
            campaignId: string;
            bidType: string | null;
            targeting: import("@prisma/client/runtime/client").JsonValue | null;
            campaign?: unknown;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(req: any, id: string): Promise<{
        budget: number;
        bidAmount: number;
        name: string;
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AdGroupStatus;
        externalId: string | null;
        campaignId: string;
        bidType: string | null;
        targeting: import("@prisma/client/runtime/client").JsonValue | null;
        campaign?: unknown;
    }>;
    update(req: any, id: string, updateAdGroupDto: UpdateAdGroupDto): Promise<{
        [key: string]: unknown;
        id: string;
        name: string;
    }>;
    remove(req: any, id: string): Promise<{
        message: string;
    }>;
}
