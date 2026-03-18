"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRangeUtil = void 0;
const dashboard_overview_dto_1 = require("../../modules/dashboard/dto/dashboard-overview.dto");
class DateRangeUtil {
    static getDateRangeByPeriod(period) {
        const now = new Date();
        switch (period) {
            case dashboard_overview_dto_1.PeriodEnum.THIS_MONTH: {
                const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
                const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
                return { startDate, endDate };
            }
            case dashboard_overview_dto_1.PeriodEnum.LAST_MONTH: {
                const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0));
                const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));
                return { startDate, endDate };
            }
            case dashboard_overview_dto_1.PeriodEnum.THIRTY_DAYS:
                return this.getDateRange(30);
            case dashboard_overview_dto_1.PeriodEnum.SEVEN_DAYS:
            default:
                return this.getDateRange(7);
        }
    }
    static getPreviousPeriodByPeriod(period, currentStartDate, currentEndDate) {
        const duration = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));
        const endDate = new Date(currentStartDate);
        endDate.setUTCDate(endDate.getUTCDate() - 1);
        endDate.setUTCHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - duration + 1);
        startDate.setUTCHours(0, 0, 0, 0);
        return { startDate, endDate };
    }
    static parsePeriodDays(period) {
        const match = period.match(/^(\d+)d$/);
        if (match) {
            return parseInt(match[1], 10);
        }
        if (period === '7d')
            return 7;
        if (period === '14d')
            return 14;
        if (period === '30d')
            return 30;
        if (period === '90d')
            return 90;
        return 7;
    }
    static getDateRange(days) {
        const now = new Date();
        const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
        const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
        return { startDate, endDate };
    }
    static getPreviousPeriodDateRange(currentStartDate, days) {
        const endDate = new Date(currentStartDate);
        endDate.setUTCDate(endDate.getUTCDate() - 1);
        endDate.setUTCHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
        startDate.setUTCHours(0, 0, 0, 0);
        return { startDate, endDate };
    }
}
exports.DateRangeUtil = DateRangeUtil;
//# sourceMappingURL=date-range.util.js.map