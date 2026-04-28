import { PeriodEnum } from '../../modules/dashboard/dto/dashboard-overview.dto';

export class DateRangeUtil {
    /**
     * Get date range based on PeriodEnum
     * Supports:
     * - 1d: today
     * - 7d: last 7 days including today
     * - this_month: first day of current month to today
     * - last_month: full previous month
     * - last_3_months: full previous 3 months excluding current month
     * - 30d / 90d: legacy fallback mapped to last_month / last_3_months
     */
    static getDateRangeByPeriod(period: PeriodEnum): { startDate: Date; endDate: Date } {
        const now = new Date();

        switch (period) {
            case PeriodEnum.ONE_DAY:
                return this.getDateRange(1);

            case PeriodEnum.YESTERDAY:
                return this.getYesterdayRange();

            case PeriodEnum.SEVEN_DAYS:
                return this.getDateRange(7);

            case PeriodEnum.FOURTEEN_DAYS:
                return this.getDateRange(14);

            case PeriodEnum.THIRTY_DAYS:
                return this.getLastFullMonthsRange(1);

            case PeriodEnum.NINETY_DAYS:
                return this.getLastFullMonthsRange(3);

            case PeriodEnum.THIS_MONTH: {
                const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
                const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
                return { startDate, endDate };
            }

            case PeriodEnum.LAST_MONTH:
                return this.getLastFullMonthsRange(1);

            case PeriodEnum.LAST_3_MONTHS:
                return this.getLastFullMonthsRange(3);

            default:
                return this.getDateRangeByPeriod(PeriodEnum.THIS_MONTH);
        }
    }

    /**
     * Get previous period date range for growth comparison
     * Matches the same duration as the current period
     */
    static getPreviousPeriodByPeriod(period: PeriodEnum, currentStartDate: Date, currentEndDate: Date): { startDate: Date; endDate: Date } {
        const duration = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));

        const endDate = new Date(currentStartDate);
        endDate.setUTCDate(endDate.getUTCDate() - 1);
        endDate.setUTCHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - duration + 1);
        startDate.setUTCHours(0, 0, 0, 0);

        return { startDate, endDate };
    }

    /**
     * Parse period string to number of days
     */
    static parsePeriodDays(period: string): number {
        const match = period.match(/^(\d+)d$/);
        if (match) {
            return parseInt(match[1], 10);
        }

        if (period === '1d') return 1;
        if (period === 'yesterday') return 1;
        if (period === '7d') return 7;
        if (period === '14d') return 14;

        if (period === 'this_month') {
            return new Date().getDate();
        }

        if (period === '30d') return 30;
        if (period === '90d') return 90;
        
        return new Date().getDate();
    }

    /**
     * Get start and end dates for a given number of days
     * Uses UTC dates for consistent Prisma/PostgreSQL matching
     */
    static getDateRange(days: number): { startDate: Date; endDate: Date } {
        const now = new Date();
        const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

        const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

        return { startDate, endDate };
    }

    /**
     * Get previous period date range for comparison
     */
    static getPreviousPeriodDateRange(currentStartDate: Date, days: number): { startDate: Date; endDate: Date } {
        const endDate = new Date(currentStartDate);
        endDate.setUTCDate(endDate.getUTCDate() - 1);
        endDate.setUTCHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
        startDate.setUTCHours(0, 0, 0, 0);

        return { startDate, endDate };
    }

    static getLastFullMonthsRange(months: number): { startDate: Date; endDate: Date } {
        const now = new Date();

        const startDate = new Date(Date.UTC(
            now.getFullYear(),
            now.getMonth() - months,
            1,
            0,
            0,
            0,
            0
        ));

        const endDate = new Date(Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            0,
            23,
            59,
            59,
            999
        ));

        return { startDate, endDate };
    }

    static getYesterdayRange(): { startDate: Date; endDate: Date } {
        const now = new Date();

        const startDate = new Date(Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1,
            0,
            0,
            0,
            0
        ));

        const endDate = new Date(Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1,
            23,
            59,
            59,
            999
        ));

        return { startDate, endDate };
    }
}
