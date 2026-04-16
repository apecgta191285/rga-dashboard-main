import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/modules/prisma/prisma.service';
import { EncryptionService } from './src/common/services/encryption.service';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const encryptionService = app.get(EncryptionService);

  console.log("=== GETTING CONNECTED ACCOUNTS ===");
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

  // DECRYPT THE REFRESH TOKEN
  const plainRefreshToken = encryptionService.decrypt(account.refreshToken);

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  
  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: plainRefreshToken,
            grant_type: 'refresh_token'
        }
    });

    console.log("-> Access Token Acquired Successfully via Decrypted Refresh Token!");

    // Fetch campaigns
    const cleanCustomerId = (account.loginCustomerId || account.customerId).replace(/-/g, '');
    const query = `SELECT campaign.id, campaign.name, campaign.status FROM campaign LIMIT 20`;
    
    console.log(`-> Fetching campaigns for Customer ID: ${cleanCustomerId}`);
    const adsResponse = await axios.post(
         `https://googleads.googleapis.com/v15/customers/${cleanCustomerId}/googleAds:searchStream`,
         { query },
         {
             headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`,
                'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
                 ...(account.loginCustomerId && { 'login-customer-id': account.loginCustomerId.replace(/-/g, '') })
             }
         }
    );
    
    const results = adsResponse.data.map((chunk: any) => chunk.results).flat().filter(Boolean);
    console.log(`-> SUCCESS! FOUND ${results.length} CAMPAIGNS IN GOOGLE ADS FOR CUSTOMER ${cleanCustomerId}.`);
    
    if (results.length > 0) {
        console.log("Sample Campaign:", results[0]);
    } else {
        console.log("Google Ads API authentically returned 0 campaigns. This means the ad account is empty or using wrong ID.");
    }

  } catch (err: any) {
    console.log("-> TOKEN OR API FAILED.");
    if (err.response) {
       console.log("HTTP:", err.response.status);
       console.log(JSON.stringify(err.response.data, null, 2));
    } else {
       console.log(err.message);
    }
  }

  await app.close();
}

bootstrap();
