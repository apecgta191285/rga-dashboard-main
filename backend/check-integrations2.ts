import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const syncLogs = await prisma.syncLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
        tenant: { include: { users: { select: { email: true } } } }
    }
  });

  console.log("Recent Sync Logs:");
  for (const log of syncLogs) {
      const emails = log.tenant?.users.map(u => u.email).join(', ') || 'Unknown';
      console.log(`Tenant: ${emails} | Status: ${log.status} | Platform: ${log.platform} | Records: ${log.recordsSync} | Error: ${log.errorMessage}`);
  }

  const gaAccounts = await prisma.googleAdsAccount.findMany({
    include: { tenant: { include: { users: { select: { email: true } } } } }
  });

  console.log("\nAll Google Ads Accounts Connected:");
  for (const acc of gaAccounts) {
      const emails = acc.tenant?.users.map(u => u.email).join(', ') || 'Unknown';
      console.log(`Tenant: ${emails} | Status: ${acc.status} | Last Sync: ${acc.lastSyncAt}`);
  }

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
