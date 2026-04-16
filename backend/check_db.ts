
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const totalAccounts = await prisma.googleAdsAccount.count();
    console.log(`Total Google Ads Accounts: ${totalAccounts}`);

    const accounts = await prisma.googleAdsAccount.findMany({
      select: {
        id: true,
        customerId: true,
        accountName: true,
        loginCustomerId: true,
        isMccAccount: true,
        status: true,
      }
    });
    console.log('Accounts:', JSON.stringify(accounts, null, 2));

    const totalCampaigns = await prisma.campaign.count({
      where: { platform: 'GOOGLE_ADS' }
    });
    console.log(`Total Google Ads Campaigns: ${totalCampaigns}`);

    const syncLogs = await prisma.syncLog.findMany({
      where: { platform: 'GOOGLE_ADS' },
      orderBy: { startedAt: 'desc' },
      take: 5
    });
    console.log('Recent Sync Logs:', JSON.stringify(syncLogs, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
