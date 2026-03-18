import { PrismaService } from '../prisma/prisma.service';
import { AdGroup, Prisma } from '@prisma/client';
import { QueryAdGroupsDto } from './dto';
export declare class AdGroupsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: Prisma.AdGroupCreateInput): Promise<AdGroup>;
    findAll(tenantId: string, query: QueryAdGroupsDto): Promise<[AdGroup[], number]>;
    findOne(tenantId: string, id: string): Promise<AdGroup | null>;
    findByCampaignId(tenantId: string, campaignId: string): Promise<AdGroup[]>;
    update(tenantId: string, id: string, data: Prisma.AdGroupUpdateInput): Promise<AdGroup>;
    remove(tenantId: string, id: string): Promise<void>;
    hardDelete(tenantId: string, id: string): Promise<void>;
    verifyCampaignOwnership(tenantId: string, campaignId: string): Promise<boolean>;
}
