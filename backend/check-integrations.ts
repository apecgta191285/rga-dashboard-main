import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.googleAdsAccount.findMany({
    include: {
      tenant: {
        include: {
          users: { select: { email: true } }
        }
      }
    }
  });
  
  console.log('Google Ads Integrations:');
  for (const acc of accounts) {
    const emails = acc.tenant.users.map(u => u.email).join(', ');
    const metricCount = await prisma.metric.count({
        where: { tenantId: acc.tenantId, platform: 'GOOGLE_ADS' }
    });
    console.log(`Tenant: ${emails} | Status: ${acc.status} | CustomerId: ${acc.customerId} | Metrics Count: ${metricCount}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
