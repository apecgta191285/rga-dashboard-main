"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdSimulatorEngine = void 0;
const faker_1 = require("@faker-js/faker");
const date_fns_1 = require("date-fns");
const math_safety_util_1 = require("../utils/math-safety.util");
const platform_configs_1 = require("./platform-configs");
class AdSimulatorEngine {
    constructor() {
        this.WEEKDAY_FACTOR = 1.0;
        this.WEEKEND_FACTOR = 0.7;
        this.MAX_GROWTH_RATE = 0.5;
        this.MAX_DECLINE_RATE = 0.4;
        this.DEFAULT_NOISE_VARIANCE = 0.1;
        this.CTR_MIN = 0.015;
        this.CTR_MAX = 0.045;
        this.CPC_MIN = 0.5;
        this.CPC_MAX = 3.5;
        this.CVR_MIN = 0.02;
        this.CVR_MAX = 0.08;
        this.AOV_MIN = 50;
        this.AOV_MAX = 200;
    }
    getSeasonalityFactor(date, config) {
        if (!(0, date_fns_1.isWeekend)(date)) {
            return this.WEEKDAY_FACTOR;
        }
        return config.weekendFactor ?? this.WEEKEND_FACTOR;
    }
    applyTrend(baseValue, trendProfile, dayIndex, totalDays) {
        const progress = (0, math_safety_util_1.safeDiv)(dayIndex, Math.max(totalDays - 1, 1));
        let trendMultiplier = 1.0;
        switch (trendProfile) {
            case 'GROWTH':
                trendMultiplier = 1.0 + progress * this.MAX_GROWTH_RATE;
                break;
            case 'DECLINE':
                trendMultiplier = 1.0 - progress * this.MAX_DECLINE_RATE;
                break;
            case 'SPIKE':
                const isSpike = faker_1.faker.datatype.boolean({ probability: 0.05 });
                trendMultiplier = isSpike ? 5.0 : 1.0;
                break;
            case 'STABLE':
            default:
                trendMultiplier = 1.0;
                break;
        }
        return (0, math_safety_util_1.safeFloat)(baseValue * trendMultiplier);
    }
    applyNoise(value, variancePercent = this.DEFAULT_NOISE_VARIANCE) {
        const noiseFactor = faker_1.faker.number.float({
            min: 1 - variancePercent,
            max: 1 + variancePercent,
            fractionDigits: 4,
        });
        return (0, math_safety_util_1.safeFloat)(value * noiseFactor);
    }
    applyFunnel(impressions, config) {
        const dailyCtr = faker_1.faker.number.float({
            min: config.ctrRange[0],
            max: config.ctrRange[1],
            fractionDigits: 4,
        });
        const dailyCpc = faker_1.faker.number.float({
            min: config.cpcRange[0],
            max: config.cpcRange[1],
            fractionDigits: 2,
        });
        const dailyCvr = faker_1.faker.number.float({
            min: config.cvrRange[0],
            max: config.cvrRange[1],
            fractionDigits: 4,
        });
        const dailyAov = faker_1.faker.number.float({
            min: config.aovRange[0],
            max: config.aovRange[1],
            fractionDigits: 2,
        });
        const rawClicks = impressions * dailyCtr;
        const clicks = Math.min(Math.floor(rawClicks), impressions);
        const cost = (0, math_safety_util_1.safeFloat)(clicks * dailyCpc);
        const rawConversions = clicks * dailyCvr;
        const conversions = Math.min(Math.floor(rawConversions), clicks);
        const revenue = (0, math_safety_util_1.safeFloat)(conversions * dailyAov);
        const actualCtr = (0, math_safety_util_1.safeCtr)(clicks, impressions);
        const actualCpc = (0, math_safety_util_1.safeCpc)(cost, clicks);
        const actualCvr = (0, math_safety_util_1.safeConversionRate)(conversions, clicks);
        const roas = (0, math_safety_util_1.safeRoas)(revenue, cost);
        const actualAov = (0, math_safety_util_1.safeDiv)(revenue, conversions);
        return {
            clicks,
            cost: this.roundToTwoDecimals(cost),
            conversions,
            revenue: this.roundToTwoDecimals(revenue),
            ctr: this.roundToTwoDecimals(actualCtr),
            cpc: this.roundToTwoDecimals(actualCpc),
            cvr: this.roundToTwoDecimals(actualCvr),
            roas: this.roundToTwoDecimals(roas),
            aov: this.roundToTwoDecimals(actualAov),
        };
    }
    roundToTwoDecimals(value) {
        return Math.round(value * 100) / 100;
    }
    generateDailyMetrics(params) {
        const { date, trendProfile, baseImpressions, dayIndex = 0, totalDays = 30, platform, } = params;
        const config = (0, platform_configs_1.getPlatformConfig)(platform);
        const platformAdjustedImpressions = baseImpressions * config.impressionMultiplier;
        const seasonalityFactor = this.getSeasonalityFactor(date, config);
        const afterSeasonality = platformAdjustedImpressions * seasonalityFactor;
        const afterTrend = this.applyTrend(afterSeasonality, trendProfile, dayIndex, totalDays);
        const afterNoise = this.applyNoise(afterTrend);
        const finalImpressions = Math.max(0, Math.floor(afterNoise));
        const funnelMetrics = this.applyFunnel(finalImpressions, config);
        return {
            impressions: finalImpressions,
            clicks: funnelMetrics.clicks ?? 0,
            cost: funnelMetrics.cost ?? 0,
            conversions: funnelMetrics.conversions ?? 0,
            revenue: funnelMetrics.revenue ?? 0,
            ctr: funnelMetrics.ctr ?? 0,
            cpc: funnelMetrics.cpc ?? 0,
            cvr: funnelMetrics.cvr ?? 0,
            roas: funnelMetrics.roas ?? 0,
            aov: funnelMetrics.aov ?? 0,
        };
    }
    generateDateRangeMetrics(startDate, endDate, trendProfile, baseImpressions, platform) {
        const results = [];
        const msPerDay = 24 * 60 * 60 * 1000;
        const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) +
            1;
        const current = new Date(startDate);
        let dayIndex = 0;
        while (current <= endDate) {
            const metrics = this.generateDailyMetrics({
                date: new Date(current),
                trendProfile,
                baseImpressions,
                dayIndex,
                totalDays,
                platform,
            });
            results.push({
                date: new Date(current),
                metrics,
            });
            current.setDate(current.getDate() + 1);
            dayIndex++;
        }
        return results;
    }
}
exports.AdSimulatorEngine = AdSimulatorEngine;
//# sourceMappingURL=ad-simulator.engine.js.map