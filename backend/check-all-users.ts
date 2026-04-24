import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser(email: string) {
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
  const campaigns = await prisma.campaign.findMany({
    where: { tenantId, platform: 'GOOGLE_ADS' }
  });

  console.log(`Campaigns in DB: ${campaigns.length}`);
  
  const campaignIds = campaigns.map(c => c.id);
  const metricsCount = await prisma.metric.count({
    where: { campaignId: { in: campaignIds } }
  });
  console.log(`Total Metrics in DB: ${metricsCount}`);

  const marchMetrics = await prisma.metric.aggregate({
    where: {
      campaignId: { in: campaignIds },
      date: { gte: new Date('2026-03-01'), lte: new Date('2026-03-31') }
    },
    _sum: { spend: true }
  });
  console.log(`March Spend: ${marchMetrics._sum.spend || 0}`);
}

async function main() {
  await checkUser('gear.wcr1@gmail.com');
  await checkUser('testuser@gmail.com');
}

main().finally(() => prisma.$disconnect());
