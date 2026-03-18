import { PeriodEnum } from '../../modules/dashboard/dto/dashboard-overview.dto';
export declare class DateRangeUtil {
    static getDateRangeByPeriod(period: PeriodEnum): {
        startDate: Date;
        endDate: Date;
    };
    static getPreviousPeriodByPeriod(period: PeriodEnum, currentStartDate: Date, currentEndDate: Date): {
        startDate: Date;
        endDate: Date;
    };
    static parsePeriodDays(period: string): number;
    static getDateRange(days: number): {
        startDate: Date;
        endDate: Date;
    };
    static getPreviousPeriodDateRange(currentStartDate: Date, days: number): {
        startDate: Date;
        endDate: Date;
    };
}
