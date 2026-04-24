import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'gear.wcr1@gmail.com';
  console.log(`=== Database Check for ${email} ===`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  });

  if (!user) {
    console.log("User not found.");
    return;
  }

  const tenantId = user.tenantId;
  console.log(`Tenant ID: ${tenantId}`);

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId, platform: 'GOOGLE_ADS' },
    select: { id: true, name: true, externalId: true, status: true }
  });

  console.log(`Campaigns in DB: ${campaigns.length}`);
  if (campaigns.length > 0) {
    campaigns.forEach(c => console.log(`  - [${c.externalId}] ${c.name} (${c.status})`));
    
    const campaignIds = campaigns.map(c => c.id);
    const metricsCount = await prisma.metric.count({
      where: { campaignId: { in: campaignIds } }
    });
    console.log(`Total Metrics in DB: ${metricsCount}`);

    const lastMetrics = await prisma.metric.findMany({
      where: { campaignId: { in: campaignIds } },
      orderBy: { date: 'desc' },
      take: 5
    });

    if (lastMetrics.length > 0) {
      console.log("Last 5 Metrics:");
      lastMetrics.forEach(m => console.log(`  - Date: ${m.date.toISOString().split('T')[0]}, Spend: ${m.spend}, Revenue: ${m.revenue}`));
    } else {
      console.log("No metrics found in DB for these campaigns.");
    }
    
    // Check if there are metrics for March 2026 (Last Month)
    const marchMetrics = await prisma.metric.count({
      where: {
        campaignId: { in: campaignIds },
        date: {
          gte: new Date('2026-03-01'),
          lte: new Date('2026-03-31')
        }
      }
    });
    console.log(`Metrics found for March 2026: ${marchMetrics}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
