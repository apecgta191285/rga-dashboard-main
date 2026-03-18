import { DashboardOverviewDataDto, PeriodEnum, RecentCampaignDto } from '../dashboard/dto/dashboard-overview.dto';
export declare class MockDataService {
    getMockOverview(period: PeriodEnum): DashboardOverviewDataDto;
    getMockCampaigns(): RecentCampaignDto[];
    private getDaysFromPeriod;
    private generateSummary;
    private generateGrowth;
    private generateTrends;
    private generateRecentCampaigns;
}
