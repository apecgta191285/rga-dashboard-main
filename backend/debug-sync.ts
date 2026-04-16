import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('--- Checking Sync Logs ---');
    const logs = await prisma.syncLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Recent Sync Logs:', JSON.stringify(logs, null, 2));

    console.log('\n--- Checking Integration Status ---');
    const integrations = await prisma.integration.findMany();
    console.log('Integrations:', JSON.stringify(integrations, null, 2));

    console.log('\n--- Checking Google Ads Accounts ---');
    const googleAccounts = await prisma.googleAdsAccount.findMany();
    console.log('Google Ads Accounts:', JSON.stringify(googleAccounts.map(a => ({
        id: a.id,
        customerId: a.customerId,
        status: a.status,
        lastSyncAt: a.lastSyncAt
    })), null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
