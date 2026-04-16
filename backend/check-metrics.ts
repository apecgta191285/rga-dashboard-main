import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const campaignCount = await prisma.campaign.count();
    const metricCount = await prisma.metric.count();
    const campaignWithBudgetCount = await prisma.campaign.count({
      where: { budget: { gt: 0 } }
    });
    const metricsWithRevenueCount = await prisma.metric.count({
        where: { revenue: { gt: 0 } }
    });

    console.log('Campaign count:', campaignCount);
    console.log('Metric count:', metricCount);
    console.log('Campaigns with Budget > 0:', campaignWithBudgetCount);
    console.log('Metrics with Revenue > 0:', metricsWithRevenueCount);

    const latestMetrics = await prisma.metric.findMany({
        take: 5,
        orderBy: { date: 'desc' }
    });
    console.log('Latest metrics:', JSON.stringify(latestMetrics, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
