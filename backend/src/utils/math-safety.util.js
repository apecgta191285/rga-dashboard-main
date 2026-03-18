"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeFloat = safeFloat;
exports.safeDiv = safeDiv;
exports.safeCtr = safeCtr;
exports.safeCpc = safeCpc;
exports.safeCpm = safeCpm;
exports.safeRoas = safeRoas;
exports.safeRoi = safeRoi;
exports.safeCpa = safeCpa;
exports.safeConversionRate = safeConversionRate;
function safeFloat(val) {
    return Number.isFinite(val) && !Number.isNaN(val) ? val : 0;
}
function safeDiv(numerator, denominator) {
    if (denominator === 0) {
        return 0;
    }
    return safeFloat(numerator / denominator);
}
function safeCtr(clicks, impressions) {
    return safeDiv(clicks, impressions) * 100;
}
function safeCpc(spend, clicks) {
    return safeDiv(spend, clicks);
}
function safeCpm(spend, impressions) {
    return safeDiv(spend, impressions) * 1000;
}
function safeRoas(revenue, spend) {
    return safeDiv(revenue, spend);
}
function safeRoi(revenue, spend, defaultValue = -100) {
    if (spend === 0) {
        return defaultValue;
    }
    return safeFloat(((revenue - spend) / spend) * 100);
}
function safeCpa(spend, conversions) {
    return safeDiv(spend, conversions);
}
function safeConversionRate(conversions, clicks) {
    return safeDiv(conversions, clicks) * 100;
}
//# sourceMappingURL=math-safety.util.js.map