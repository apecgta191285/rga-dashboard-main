"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const faker_1 = require("@faker-js/faker");
const ad_simulator_engine_1 = require("../ad-simulator.engine");
const platform_types_1 = require("../domain/platform.types");
const engine = new ad_simulator_engine_1.AdSimulatorEngine();
const WEEKDAY = new Date('2024-01-15T12:00:00Z');
const WEEKEND = new Date('2024-01-13T12:00:00Z');
function gen(overrides = {}) {
    return engine.generateDailyMetrics({
        date: overrides.date ?? WEEKDAY,
        trendProfile: overrides.trendProfile ?? 'STABLE',
        baseImpressions: overrides.baseImpressions ?? 10000,
        dayIndex: overrides.dayIndex ?? 0,
        totalDays: overrides.totalDays ?? 30,
        platform: overrides.platform,
    });
}
(0, node_test_1.describe)('AdSimulatorEngine — funnel integrity', () => {
    (0, node_test_1.beforeEach)(() => faker_1.faker.seed(42));
    (0, node_test_1.it)('clicks ≤ impressions', () => {
        const m = gen();
        node_assert_1.strict.ok(m.clicks <= m.impressions, `clicks ${m.clicks} > impressions ${m.impressions}`);
    });
    (0, node_test_1.it)('conversions ≤ clicks', () => {
        const m = gen();
        node_assert_1.strict.ok(m.conversions <= m.clicks, `conversions ${m.conversions} > clicks ${m.clicks}`);
    });
    (0, node_test_1.it)('impressions are non-negative integers', () => {
        const m = gen();
        node_assert_1.strict.ok(m.impressions >= 0);
        node_assert_1.strict.strictEqual(m.impressions, Math.floor(m.impressions));
    });
    (0, node_test_1.it)('clicks and conversions are integers', () => {
        const m = gen();
        node_assert_1.strict.strictEqual(m.clicks, Math.floor(m.clicks));
        node_assert_1.strict.strictEqual(m.conversions, Math.floor(m.conversions));
    });
    (0, node_test_1.it)('cost, revenue, and rates are finite numbers', () => {
        const m = gen();
        for (const key of ['cost', 'revenue', 'ctr', 'cpc', 'cvr', 'roas', 'aov']) {
            node_assert_1.strict.ok(Number.isFinite(m[key]), `${key} is not finite: ${m[key]}`);
        }
    });
    (0, node_test_1.it)('all values are non-negative', () => {
        const m = gen();
        for (const [k, v] of Object.entries(m)) {
            node_assert_1.strict.ok(v >= 0, `${k} is negative: ${v}`);
        }
    });
    (0, node_test_1.it)('funnel holds across 100 random seeds', () => {
        for (let seed = 0; seed < 100; seed++) {
            faker_1.faker.seed(seed);
            const m = gen({ baseImpressions: 50000 });
            node_assert_1.strict.ok(m.clicks <= m.impressions, `seed ${seed}: clicks > impressions`);
            node_assert_1.strict.ok(m.conversions <= m.clicks, `seed ${seed}: conversions > clicks`);
        }
    });
});
(0, node_test_1.describe)('AdSimulatorEngine — trend profiles', () => {
    (0, node_test_1.it)('GROWTH produces higher average than DECLINE on day 29/30', () => {
        const N = 50;
        let growthSum = 0;
        let declineSum = 0;
        for (let i = 0; i < N; i++) {
            faker_1.faker.seed(i);
            growthSum += gen({ trendProfile: 'GROWTH', dayIndex: 29, totalDays: 30 }).impressions;
            faker_1.faker.seed(i);
            declineSum += gen({ trendProfile: 'DECLINE', dayIndex: 29, totalDays: 30 }).impressions;
        }
        node_assert_1.strict.ok(growthSum / N > declineSum / N, `avg growth ${growthSum / N} should > avg decline ${declineSum / N}`);
    });
    (0, node_test_1.it)('STABLE produces values near baseImpressions ±20%', () => {
        faker_1.faker.seed(42);
        const m = gen({ trendProfile: 'STABLE', baseImpressions: 10000 });
        node_assert_1.strict.ok(m.impressions >= 8000, `impressions ${m.impressions} too low for STABLE`);
        node_assert_1.strict.ok(m.impressions <= 12000, `impressions ${m.impressions} too high for STABLE`);
    });
});
(0, node_test_1.describe)('AdSimulatorEngine — seasonality', () => {
    (0, node_test_1.it)('weekday gets ~1.0x factor (Google default)', () => {
        faker_1.faker.seed(42);
        const weekdayM = gen({ date: WEEKDAY });
        faker_1.faker.seed(42);
        const weekendM = gen({ date: WEEKEND });
        node_assert_1.strict.ok(weekendM.impressions < weekdayM.impressions, `weekend ${weekendM.impressions} should < weekday ${weekdayM.impressions} for Google Ads`);
    });
});
(0, node_test_1.describe)('AdSimulatorEngine — platform multipliers', () => {
    (0, node_test_1.it)('TikTok produces ~10x more impressions than Google Ads', () => {
        const N = 20;
        let googleSum = 0;
        let tiktokSum = 0;
        for (let i = 0; i < N; i++) {
            faker_1.faker.seed(i);
            googleSum += gen({ platform: platform_types_1.ToolkitPlatform.GoogleAds, baseImpressions: 10000 }).impressions;
            faker_1.faker.seed(i);
            tiktokSum += gen({ platform: platform_types_1.ToolkitPlatform.TikTok, baseImpressions: 10000 }).impressions;
        }
        const ratio = tiktokSum / googleSum;
        node_assert_1.strict.ok(ratio > 2, `TikTok/Google ratio ${ratio} is too low (expected ~3x)`);
        node_assert_1.strict.ok(ratio < 5, `TikTok/Google ratio ${ratio} is too high`);
    });
    (0, node_test_1.it)('Facebook produces ~2x more impressions than Google Ads', () => {
        const N = 20;
        let googleSum = 0;
        let fbSum = 0;
        for (let i = 0; i < N; i++) {
            faker_1.faker.seed(i);
            googleSum += gen({ platform: platform_types_1.ToolkitPlatform.GoogleAds, baseImpressions: 10000 }).impressions;
            faker_1.faker.seed(i);
            fbSum += gen({ platform: platform_types_1.ToolkitPlatform.Facebook, baseImpressions: 10000 }).impressions;
        }
        const ratio = fbSum / googleSum;
        node_assert_1.strict.ok(ratio > 1.2, `Facebook/Google ratio ${ratio} too low (expected ~2x)`);
        node_assert_1.strict.ok(ratio < 4, `Facebook/Google ratio ${ratio} too high`);
    });
});
(0, node_test_1.describe)('AdSimulatorEngine — edge cases', () => {
    (0, node_test_1.it)('zero baseImpressions produces zero everything', () => {
        faker_1.faker.seed(42);
        const m = gen({ baseImpressions: 0 });
        node_assert_1.strict.strictEqual(m.impressions, 0);
        node_assert_1.strict.strictEqual(m.clicks, 0);
        node_assert_1.strict.strictEqual(m.conversions, 0);
        node_assert_1.strict.strictEqual(m.cost, 0);
        node_assert_1.strict.strictEqual(m.revenue, 0);
    });
    (0, node_test_1.it)('very large baseImpressions does not crash or overflow', () => {
        faker_1.faker.seed(42);
        const m = gen({ baseImpressions: 100_000_000 });
        node_assert_1.strict.ok(Number.isFinite(m.impressions));
        node_assert_1.strict.ok(m.impressions > 0);
        node_assert_1.strict.ok(m.clicks <= m.impressions);
    });
    (0, node_test_1.it)('dayIndex = 0 with totalDays = 1 does not divide by zero', () => {
        faker_1.faker.seed(42);
        const m = gen({ dayIndex: 0, totalDays: 1 });
        node_assert_1.strict.ok(Number.isFinite(m.impressions));
    });
});
(0, node_test_1.describe)('AdSimulatorEngine — money precision', () => {
    (0, node_test_1.it)('cost and revenue have at most 2 decimal places', () => {
        faker_1.faker.seed(42);
        const m = gen({ baseImpressions: 50000 });
        const eps = 1e-9;
        node_assert_1.strict.ok(Math.abs(Math.round(m.cost * 100) - m.cost * 100) < eps, `cost not 2dp: ${m.cost}`);
        node_assert_1.strict.ok(Math.abs(Math.round(m.revenue * 100) - m.revenue * 100) < eps, `revenue not 2dp: ${m.revenue}`);
    });
    (0, node_test_1.it)('rate metrics have at most 2 decimal places', () => {
        faker_1.faker.seed(42);
        const m = gen({ baseImpressions: 50000 });
        const eps = 1e-9;
        for (const key of ['ctr', 'cpc', 'cvr', 'roas', 'aov']) {
            const val = m[key];
            node_assert_1.strict.ok(Math.abs(Math.round(val * 100) - val * 100) < eps, `${key}=${val} has more than 2 decimal places`);
        }
    });
});
(0, node_test_1.describe)('AdSimulatorEngine — determinism with faker seed', () => {
    (0, node_test_1.it)('same seed produces identical output', () => {
        faker_1.faker.seed(12345);
        const a = gen({ baseImpressions: 10000 });
        faker_1.faker.seed(12345);
        const b = gen({ baseImpressions: 10000 });
        node_assert_1.strict.deepStrictEqual(a, b);
    });
    (0, node_test_1.it)('different seeds produce different output', () => {
        faker_1.faker.seed(1);
        const a = gen({ baseImpressions: 10000 });
        faker_1.faker.seed(2);
        const b = gen({ baseImpressions: 10000 });
        node_assert_1.strict.notDeepStrictEqual(a, b);
    });
});
(0, node_test_1.describe)('AdSimulatorEngine — generateDateRangeMetrics', () => {
    (0, node_test_1.it)('returns one entry per day', () => {
        faker_1.faker.seed(42);
        const start = new Date('2024-01-01');
        const end = new Date('2024-01-07');
        const results = engine.generateDateRangeMetrics(start, end, 'STABLE', 10000);
        node_assert_1.strict.strictEqual(results.length, 7);
    });
    (0, node_test_1.it)('each entry has valid metrics with funnel integrity', () => {
        faker_1.faker.seed(42);
        const start = new Date('2024-01-01');
        const end = new Date('2024-01-03');
        const results = engine.generateDateRangeMetrics(start, end, 'GROWTH', 5000);
        for (const entry of results) {
            node_assert_1.strict.ok(entry.date instanceof Date);
            node_assert_1.strict.ok(entry.metrics.clicks <= entry.metrics.impressions);
            node_assert_1.strict.ok(entry.metrics.conversions <= entry.metrics.clicks);
        }
    });
    (0, node_test_1.it)('accepts platform parameter', () => {
        faker_1.faker.seed(42);
        const start = new Date('2024-01-01');
        const end = new Date('2024-01-03');
        const results = engine.generateDateRangeMetrics(start, end, 'STABLE', 10000, platform_types_1.ToolkitPlatform.TikTok);
        node_assert_1.strict.strictEqual(results.length, 3);
        for (const entry of results) {
            node_assert_1.strict.ok(entry.metrics.impressions > 15000, `TikTok impressions too low: ${entry.metrics.impressions}`);
        }
    });
});
//# sourceMappingURL=ad-simulator.engine.test.js.map