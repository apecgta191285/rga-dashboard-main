"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const client_1 = require("@prisma/client");
const platform_mapper_1 = require("../core/platform.mapper");
const platform_types_1 = require("../domain/platform.types");
const prisma = new client_1.PrismaClient();
async function main() {
    const tenantId = '22222222-2222-2222-2222-222222222222';
    const source = 'toolkit:seed-pass';
    const googleAds = platform_mapper_1.PlatformMapper.toPersistence(platform_types_1.ToolkitPlatform.GoogleAds);
    console.log(`Seeding SUCCESS state for tenant: ${tenantId}...`);
    await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'Verification Pass Tenant',
            slug: 'verify-pass',
        }
    });
    await prisma.metric.deleteMany({ where: { tenantId } });
    await prisma.campaign.deleteMany({ where: { tenantId } });
    const campaign = await prisma.campaign.create({
        data: {
            tenantId,
            name: 'Pass Campaign',
            platform: googleAds,
            status: 'ACTIVE',
            externalId: 'pass-campaign-1'
        }
    });
    await prisma.metric.create({
        data: {
            tenantId,
            campaignId: campaign.id,
            platform: googleAds,
            date: new Date(),
            impressions: 1000,
            clicks: 50,
            spend: 100,
            conversions: 5,
            revenue: 300,
            ctr: 5.0,
            costPerClick: 2.0,
            conversionRate: 10.0,
            roas: 3.0,
            isMockData: true,
            source,
        }
    });
    console.log('Seeding COMPLETE. Verification should PASS.');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-pass.js.map