import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.metric.groupBy({
    by: ['tenantId'],
    where: { date: { gte: new Date('2026-03-01'), lte: new Date('2026-03-31') }, spend: { gt: 0 } },
    _sum: { spend: true }
  });
  console.log('Spend in March 2026 grouped by Tenant IDs:');
  console.log(result);

  const users = await prisma.user.findMany({
    select: { email: true, tenantId: true }
  });
  console.log('Users and their Tenant IDs:');
  console.log(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
