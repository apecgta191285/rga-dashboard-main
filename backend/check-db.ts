import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const recentSpendMetric = await prisma.metric.findFirst({
    where: { spend: { gt: 0 } },
    orderBy: { date: 'desc' },
    select: { date: true, spend: true, platform: true }
  });
  console.log('Most Recent Metric with Spend > 0:');
  console.log(recentSpendMetric);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
