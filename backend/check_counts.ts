import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 📊 Database Stats ---');

  const accounts = await prisma.googleAdsAccount.findMany({
    select: {
      id: true,
      customerId: true,
      accountName: true,
      tenantId: true,
      lastSyncAt: true,
      _count: {
        select: { campaigns: true }
      }
    }
  });

  console.log('Google Ads Accounts:', accounts.length);
  accounts.forEach(acc => {
    console.log(`- [${acc.customerId}] ${acc.accountName} (Tenant: ${acc.tenantId})`);
    console.log(`  Campaigns: ${acc._count.campaigns}`);
    console.log(`  Last Sync: ${acc.lastSyncAt}`);
  });

  const campaigns = await prisma.campaign.count({
    where: { platform: 'GOOGLE_ADS' }
  });
  console.log('\nTotal Google Ads Campaigns in DB:', campaigns);

  const syncLogs = await prisma.syncLog.findMany({
    where: { platform: 'GOOGLE_ADS' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('\nRecent Sync Logs:');
  syncLogs.forEach(log => {
    console.log(`- [${log.syncType}] Status: ${log.status}, Account: ${log.accountId}, Error: ${log.errorMessage || 'None'}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
