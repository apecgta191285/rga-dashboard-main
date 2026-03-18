"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const client_1 = require("@prisma/client");
const platform_mapper_1 = require("../core/platform.mapper");
const platform_types_1 = require("../domain/platform.types");
const prisma = new client_1.PrismaClient();
async function main() {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const source = 'toolkit:seed-fail';
    const googleAds = platform_mapper_1.PlatformMapper.toPersistence(platform_types_1.ToolkitPlatform.GoogleAds);
    console.log(`Seeding FAILURE state for tenant: ${tenantId}...`);
    await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'Verification Fail Tenant',
            slug: 'verify-fail',
        }
    });
    await prisma.metric.deleteMany({ where: { tenantId } });
    await prisma.campaign.deleteMany({ where: { tenantId } });
    const campaign = await prisma.campaign.create({
        data: {
            tenantId,
            name: 'Fail Campaign',
            platform: googleAds,
            status: 'ACTIVE',
            externalId: 'fail-campaign-1'
        }
    });
    await prisma.metric.create({
        data: {
            tenantId,
            campaignId: campaign.id,
            platform: googleAds,
            date: new Date(),
            impressions: 10,
            clicks: 100,
            spend: 500,
            conversions: 5,
            revenue: 1000,
            ctr: 10.0,
            costPerClick: 5,
            conversionRate: 0.05,
            roas: 2.0,
            isMockData: true,
            source,
        }
    });
    console.log('Seeding COMPLETE. Verification should FAIL with CLICKS_LE_IMPRESSIONS.');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-fail.js.map