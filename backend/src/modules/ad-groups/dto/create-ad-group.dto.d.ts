import { AdGroupStatus } from '@prisma/client';
export declare class CreateAdGroupDto {
    name: string;
    campaignId: string;
    status?: AdGroupStatus;
    budget?: number;
    bidAmount?: number;
    bidType?: string;
    targeting?: Record<string, unknown>;
    externalId?: string;
}
