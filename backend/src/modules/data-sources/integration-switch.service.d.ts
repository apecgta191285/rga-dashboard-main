import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardOverviewResponseDto, GetDashboardOverviewDto } from '../dashboard/dto/dashboard-overview.dto';
import { UserRole } from '@prisma/client';
export declare class IntegrationSwitchService {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardOverview(user: {
        tenantId: string;
        role: UserRole;
    }, query: GetDashboardOverviewDto): Promise<DashboardOverviewResponseDto>;
    getTopCampaigns(tenantId: string, limit?: number, days?: number): Promise<{
        id: string;
        name: string;
        platform: string;
        status: string;
        metrics: {
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            revenue: number;
            roas: number;
            ctr: number;
        };
    }[]>;
}
