"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyAdMetrics = generateDailyAdMetrics;
exports.generateDailyGA4Metrics = generateDailyGA4Metrics;
exports.generateMetricsForDateRange = generateMetricsForDateRange;
const app_constants_1 = require("../../../common/constants/app.constants");
const date_utils_1 = require("../../../common/utils/date.utils");
function generateDailyAdMetrics() {
    const baseImpressions = Math.floor(Math.random() * 5000) + 1000;
    const ctrRate = 0.02 + Math.random() * 0.03;
    const clicks = Math.floor(baseImpressions * ctrRate);
    const spend = Math.floor(Math.random() * 500) + 100;
    const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.03));
    const revenue = conversions * (50 + Math.random() * 100);
    const roas = spend > 0 ? revenue / spend : 0;
    return {
        impressions: baseImpressions,
        clicks,
        spend,
        conversions,
        revenue,
        roas,
    };
}
function generateDailyGA4Metrics() {
    const activeUsers = Math.floor(Math.random() * 1000) + 100;
    const newUsers = Math.floor(activeUsers * (0.3 + Math.random() * 0.2));
    const sessions = Math.floor(activeUsers * (1.2 + Math.random() * 0.5));
    const screenPageViews = Math.floor(sessions * (2 + Math.random() * 3));
    const engagementRate = 0.4 + Math.random() * 0.3;
    const bounceRate = 1 - engagementRate;
    const avgSessionDuration = 60 + Math.random() * 180;
    return {
        activeUsers,
        newUsers,
        sessions,
        screenPageViews,
        engagementRate,
        bounceRate,
        avgSessionDuration,
    };
}
function generateMetricsForDateRange(days = app_constants_1.SYNC_DEFAULTS.DAYS_TO_SYNC, type = 'ads') {
    const metrics = [];
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const startDate = (0, date_utils_1.getDateDaysAgo)(days);
    const currentDate = new Date(startDate);
    while (currentDate <= todayUTC) {
        const dateKey = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
        const dailyMetrics = type === 'ads' ? generateDailyAdMetrics() : generateDailyGA4Metrics();
        metrics.push({
            date: dateKey,
            ...dailyMetrics,
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return metrics;
}
//# sourceMappingURL=metrics.generator.js.map