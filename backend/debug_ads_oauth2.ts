import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING RECENT SYNC LOGS FOR gear.wcr1@gmail.com ===");
  const syncLogs = await prisma.syncLog.findMany({
    where: {
      tenant: {
        users: { some: { email: 'gear.wcr1@gmail.com' } }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  if (syncLogs.length === 0) {
      console.log("No sync logs found.");
  } else {
      syncLogs.forEach(log => {
          console.log(`[${log.createdAt.toISOString()}] Status: ${log.status} | Records: ${log.recordsSync} | Error: ${log.errorMessage}`);
      });
  }

  console.log("\n=== TESTING OAUTH REFRESH TOKEN V2 ===");
  const account = await prisma.googleAdsAccount.findFirst({
    where: {
      tenant: {
        users: { some: { email: 'gear.wcr1@gmail.com' } }
      }
    }
  });

  if (!account) {
    console.log("No Google Ads Account connected for gear.wcr1@gmail.com");
    return;
  }

  console.log("Customer ID:", account.customerId);
  console.log("Refresh token length:", account.refreshToken ? account.refreshToken.length : 0);

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  
  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: account.refreshToken,
            grant_type: 'refresh_token'
        }
    });

    console.log("-> Access Token Acquired Successfully!");

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
    console.log(`-> SUCCESS! FOUND ${results.length} CAMPAIGNS IN GOOGLE ADS.`);
    
    // Check if campaigns were saved to the DB
    const dbCampaignCount = await prisma.campaign.count({
        where: { tenantId: account.tenantId, platform: 'GOOGLE_ADS' }
    });
    console.log(`-> Campaigns currently saved in local DB: ${dbCampaignCount}`);
    
    const dbMetricsCount = await prisma.metric.count({
        where: { tenantId: account.tenantId, platform: 'GOOGLE_ADS' }
    });
    console.log(`-> Metrics currently saved in local DB: ${dbMetricsCount}`);

  } catch (err: any) {
    console.log("-> TOKEN OR API FAILED.");
    if (err.response) {
       console.log("HTTP:", err.response.status);
       console.log(JSON.stringify(err.response.data, null, 2));
    } else {
       console.log(err.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
