import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/modules/prisma/prisma.service';
import { EncryptionService } from './src/common/services/encryption.service';
import { GoogleAdsClientService } from './src/modules/integrations/google-ads/services/google-ads-client.service';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const encryptionService = app.get(EncryptionService);
  const clientService = app.get(GoogleAdsClientService);

  console.log("=== CHECKING WHY 0 CAMPAIGNS RETURNED ===");
  const account = await prisma.googleAdsAccount.findFirst({
    where: {
      tenant: {
        users: { some: { email: 'gear.wcr1@gmail.com' } }
      }
    }
  });

  if (!account) {
    console.log("No account found.");
    await app.close();
    return;
  }

  const decryptedToken = encryptionService.decrypt(account.refreshToken);

  console.log(`Account ID: ${account.customerId}`);
  console.log(`Is MCC? ${account.isMccAccount}`);
  
  // 1. Try querying WITHOUT the status filter to see if the 12 ads are REMOVED.
  const queryAll = `
    SELECT campaign.id, campaign.name, campaign.status 
    FROM campaign
  `;
  
  try {
      const resultsAll = await clientService.rawRestQuery(
          account.customerId,
          decryptedToken,
          queryAll,
          account.loginCustomerId
      );
      console.log(`Total Campaigns (Including Removed): ${resultsAll.length}`);
      if (resultsAll.length > 0) {
          resultsAll.forEach((row: any) => console.log(`  - ${row.campaign.name} [${row.campaign.status}]`));
      } else {
          console.log("  Absolutely 0 campaigns exist in this specific customer ID.");
      }
  } catch (err: any) {
      console.log(`Error running rawQuery: ${err.message}`);
  }

  await app.close();
}

bootstrap();
