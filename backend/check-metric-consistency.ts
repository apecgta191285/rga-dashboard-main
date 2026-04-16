import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'gear.wcr1@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) return;

  console.log(`User Tenant ID: ${user.tenantId}`);

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId: user.tenantId }
  });

  console.log(`Campaign Count: ${campaigns.length}`);
  
  const metrics = await prisma.metric.findMany({
    where: { campaignId: { in: campaigns.map(c => c.id) } },
    select: { id: true, tenantId: true, campaignId: true, date: true, spend: true }
  });

  console.log(`Metric records found: ${metrics.length}`);
  if (metrics.length > 0) {
    metrics.forEach(m => {
        console.log(`Metric ID: ${m.id} | Metric Tenant: ${m.tenantId} | Date: ${m.date.toISOString().split('T')[0]} | Spend: ${m.spend}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
