import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UnifiedSyncService } from './src/modules/sync/unified-sync.service';
import { AdPlatform } from '@prisma/client';
import { PrismaService } from './src/modules/prisma/prisma.service';
import { EncryptionService } from './src/common/services/encryption.service';
import { IntegrationFactory } from './src/modules/integrations/common/integration.factory';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const syncService = app.get(UnifiedSyncService);
  const prisma = app.get(PrismaService);
  const encryptionService = app.get(EncryptionService);
  const factory = app.get(IntegrationFactory);

  const email = 'gear.wcr1@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log("User not found.");
    await app.close();
    return;
  }

  const account = await prisma.googleAdsAccount.findFirst({
    where: { tenantId: user.tenantId }
  });

  if (!account) {
    console.log("Account not found.");
    await app.close();
    return;
  }

  console.log(`=== Starting Deep Sync (90 days) for ${email} ===`);
  
  const adapter = factory.getAdapter(AdPlatform.GOOGLE_ADS);

  const credentials = {
    accessToken: encryptionService.decrypt(account.accessToken),
    refreshToken: encryptionService.decrypt(account.refreshToken),
    accountId: account.customerId,
  };

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId: user.tenantId, platform: AdPlatform.GOOGLE_ADS }
  });

  console.log(`Found ${campaigns.length} campaigns to sync metrics for.`);

  for (const campaign of campaigns) {
    if (!campaign.externalId) continue;
    
    // FETCH 90 DAYS (Jan 1 to today)
    const dateRange = {
      startDate: new Date('2026-01-01'),
      endDate: new Date(),
    };

    console.log(`  Syncing ${campaign.name} [${campaign.externalId}]...`);
    try {
        const metrics = await adapter.fetchMetrics(credentials, campaign.externalId, dateRange);
        console.log(`    Fetched ${metrics.length} metric records.`);
        if (metrics.length > 0) {
            await (syncService as any).saveCampaignMetrics(user.tenantId, AdPlatform.GOOGLE_ADS, campaign.id, metrics);
        }
    } catch (e: any) {
        console.log(`    Error: ${e.message}`);
    }
  }

  console.log("=== Deep Sync Completed ===");
  await app.close();
}

bootstrap();
