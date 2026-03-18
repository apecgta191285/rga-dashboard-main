"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daysToMs = daysToMs;
exports.getDateDaysAgo = getDateDaysAgo;
exports.formatDateYMD = formatDateYMD;
exports.getDateRangeFromPeriod = getDateRangeFromPeriod;
function daysToMs(days) {
    return days * 24 * 60 * 60 * 1000;
}
function getDateDaysAgo(days) {
    return new Date(Date.now() - daysToMs(days));
}
function formatDateYMD(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}
function getDateRangeFromPeriod(period) {
    const endDate = new Date();
    const daysMatch = period.match(/^(\d+)d$/);
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 30;
    const startDate = getDateDaysAgo(days);
    return { startDate, endDate };
}
//# sourceMappingURL=date.utils.js.map