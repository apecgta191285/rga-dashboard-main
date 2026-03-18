import { AdGroupsRepository } from './ad-groups.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateAdGroupDto, UpdateAdGroupDto, QueryAdGroupsDto } from './dto';
import { Prisma } from '@prisma/client';
export declare class AdGroupsService {
    private readonly repository;
    private readonly auditLogsService;
    constructor(repository: AdGroupsRepository, auditLogsService: AuditLogsService);
    create(tenantId: string, dto: CreateAdGroupDto): Promise<{
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
        targeting: Prisma.JsonValue | null;
        campaign?: unknown;
    }>;
    findAll(tenantId: string, query: QueryAdGroupsDto): Promise<{
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
            targeting: Prisma.JsonValue | null;
            campaign?: unknown;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(tenantId: string, id: string): Promise<{
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
        targeting: Prisma.JsonValue | null;
        campaign?: unknown;
    }>;
    update(tenantId: string, id: string, dto: UpdateAdGroupDto): Promise<{
        id: string;
        name: string;
        [key: string]: unknown;
    }>;
    remove(tenantId: string, id: string): Promise<{
        message: string;
    }>;
    findByCampaignId(tenantId: string, campaignId: string): Promise<Array<{
        id: string;
        name: string;
        [key: string]: unknown;
    }>>;
    private normalizeAdGroup;
}
