import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/modules/prisma/prisma.service';
import { EncryptionService } from './src/common/services/encryption.service';
import { GoogleAdsClientService } from './src/modules/integrations/google-ads/services/google-ads-client.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const encryptionService = app.get(EncryptionService);
  const clientService = app.get(GoogleAdsClientService);

  const email = 'gear.wcr1@gmail.com';
  const account = await prisma.googleAdsAccount.findFirst({
    where: {
      tenant: { users: { some: { email } } }
    }
  });

  if (!account) return;

  const decryptedToken = encryptionService.decrypt(account.refreshToken);
  const customerId = account.customerId;

  const endDate = '2026-04-08';
  const startDate = '2026-01-01'; // 3 months ago

  console.log(`=== Fetching Metrics from ${startDate} to ${endDate} ===`);

  const query = `
    SELECT
      segments.date,
      metrics.cost_micros,
      campaign.name
    FROM campaign
    WHERE segments.date >= '${startDate}' AND segments.date <= '${endDate}'
    AND metrics.cost_micros > 0
  `;

  try {
      const results = await clientService.rawRestQuery(
          customerId,
          decryptedToken,
          query,
          account.loginCustomerId
      );
      
      console.log(`Found ${results.length} days of spend data.`);
      if (results.length > 0) {
          results.forEach((row: any) => {
              console.log(`  Date: ${row.segments.date} | Spend: ${row.metrics.costMicros / 1000000} | Campaign: ${row.campaign.name}`);
          });
      }
  } catch (err: any) {
      if (err.response) {
          console.log("Error:", JSON.stringify(err.response.data, null, 2));
      } else {
          console.log(`Error: ${err.message}`);
      }
  }

  await app.close();
}

bootstrap();
