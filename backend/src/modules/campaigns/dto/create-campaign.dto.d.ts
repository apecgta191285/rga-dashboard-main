import { CampaignStatus, AdPlatform } from '@prisma/client';
export declare class CreateCampaignDto {
    name: string;
    platform: AdPlatform;
    status: CampaignStatus;
    budget: number;
    startDate: string;
    endDate?: string;
    externalId?: string;
}
