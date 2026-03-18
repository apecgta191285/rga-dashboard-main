export declare class QueryCampaignsDto {
    search?: string;
    ids?: string;
    platform?: string;
    status?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
}
