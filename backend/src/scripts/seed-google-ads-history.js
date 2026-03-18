"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
function clampInt(value, min, max) {
    return Math.max(min, Math.min(max, Math.trunc(value)));
}
function toUtcDateOnly(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}
function addUtcDays(date, days) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}
async function main() {
    console.log('[seed-google-ads-history] starting...');
    const now = new Date();
    const todayUtc = toUtcDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
    const endDateUtc = addUtcDays(todayUtc, -1);
    const startDateUtc = addUtcDays(todayUtc, -30);
    const campaigns = await prisma.campaign.findMany({
        where: {
            platform: client_1.AdPlatform.GOOGLE_ADS,
        },
        select: {
            id: true,
            tenantId: true,
            name: true,
        },
    });
    if (campaigns.length === 0) {
        console.log('[seed-google-ads-history] no GOOGLE_ADS campaigns found; nothing to seed.');
        return;
    }
    console.log(`[seed-google-ads-history] found ${campaigns.length} GOOGLE_ADS campaigns.`);
    const seedSource = 'seed_google_ads_history';
    for (const campaign of campaigns) {
        const deleteResult = await prisma.metric.deleteMany({
            where: {
                campaignId: campaign.id,
                platform: client_1.AdPlatform.GOOGLE_ADS,
                source: seedSource,
                date: {
                    gte: startDateUtc,
                    lte: endDateUtc,
                },
            },
        });
        const baselineImpressions = Math.floor(randomFloat(600, 2600));
        const rows = [];
        let current = new Date(startDateUtc);
        while (current <= endDateUtc) {
            const dayOfWeek = current.getUTCDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const seasonalityFactor = isWeekend ? 0.8 : 1.0;
            const noiseFactor = randomFloat(0.85, 1.15);
            const impressions = clampInt(baselineImpressions * seasonalityFactor * noiseFactor, 100, 5000);
            const ctr = randomFloat(0.01, 0.05);
            const clicks = clampInt(impressions * ctr, 0, impressions);
            const cpcThb = randomFloat(10, 50);
            const spend = clicks * cpcThb;
            const cvr = randomFloat(0.005, 0.02);
            const conversions = clampInt(clicks * cvr, 0, clicks);
            const ctrPct = impressions > 0 ? (clicks / impressions) * 100 : 0;
            const conversionRatePct = clicks > 0 ? (conversions / clicks) * 100 : 0;
            const costPerClick = clicks > 0 ? spend / clicks : 0;
            const costPerMille = impressions > 0 ? (spend / impressions) * 1000 : 0;
            const costPerAction = conversions > 0 ? spend / conversions : 0;
            rows.push({
                tenantId: campaign.tenantId,
                campaignId: campaign.id,
                date: new Date(current),
                platform: client_1.AdPlatform.GOOGLE_ADS,
                source: seedSource,
                impressions,
                clicks,
                conversions,
                spend: new client_1.Prisma.Decimal(spend.toFixed(2)),
                costPerClick: new client_1.Prisma.Decimal(costPerClick.toFixed(4)),
                costPerMille: new client_1.Prisma.Decimal(costPerMille.toFixed(4)),
                costPerAction: new client_1.Prisma.Decimal(costPerAction.toFixed(4)),
                ctr: new client_1.Prisma.Decimal(ctrPct.toFixed(4)),
                conversionRate: new client_1.Prisma.Decimal(conversionRatePct.toFixed(4)),
                roas: new client_1.Prisma.Decimal('0'),
                revenue: new client_1.Prisma.Decimal('0'),
                orders: 0,
                averageOrderValue: new client_1.Prisma.Decimal('0'),
                isMockData: true,
            });
            current = addUtcDays(current, 1);
        }
        const createResult = await prisma.metric.createMany({
            data: rows,
        });
        console.log(`[seed-google-ads-history] campaign="${campaign.name}" (id=${campaign.id}) deleted ${deleteResult.count} + created ${createResult.count} rows (${startDateUtc.toISOString().slice(0, 10)}..${endDateUtc.toISOString().slice(0, 10)}).`);
    }
    console.log('[seed-google-ads-history] done.');
}
main()
    .catch((e) => {
    console.error('[seed-google-ads-history] failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-google-ads-history.js.map