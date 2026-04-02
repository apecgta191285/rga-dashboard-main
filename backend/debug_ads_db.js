const { GoogleAdsApi } = require('google-ads-api');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Decrypt function matching EncryptionService exactly
function decrypt(ciphertext) {
  if (!ciphertext || ciphertext === 'placeholder') return null;
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  if (!ENCRYPTION_KEY) {
      console.error('ENCRYPTION_KEY not set in .env');
      return null;
  }
  
  // Use scryptSync to derive the key exactly as EncryptionService does
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  
  try {
    const textParts = ciphertext.split(':');
    if (textParts.length < 2) return null;
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
}

async function debugAds() {
  const prisma = new PrismaClient();
  const accounts = await prisma.googleAdsAccount.findMany({ 
    take: 5,
    orderBy: { updatedAt: 'desc' }
  });

  if (accounts.length === 0) {
    console.log('No Google Ads accounts found in database. Please connect one via OAuth first.');
    return;
  }

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    transport: 'rest',
    api_version: 'v18',
  });

  for (const account of accounts) {
    console.log(`\n--- Testing Account: ${account.accountName} (${account.customerId}) ---`);
    const refreshToken = decrypt(account.refreshToken);
    if (!refreshToken) {
      console.log('❌ Decryption failed or placeholder token found.');
      continue;
    }

    try {
      console.log('1. Testing listAccessibleCustomers...');
      const accessible = await client.listAccessibleCustomers(refreshToken);
      console.log('   ✅ Accessible:', JSON.stringify(accessible));

      console.log(`2. Testing Query for Customer ${account.customerId}...`);
      // Omit login_customer_id if it's a direct account or matching itself
      const loginId = account.loginCustomerId === account.customerId ? undefined : account.loginCustomerId;
      console.log(`   Using Login ID: ${loginId || 'DIRECT'}`);

      const customer = client.Customer({
        customer_id: account.customerId,
        refresh_token: refreshToken,
        login_customer_id: loginId || undefined,
      });

      const result = await customer.query(`
        SELECT campaign.id, campaign.name 
        FROM campaign 
        LIMIT 1
      `);
      console.log(`   ✅ Success! Found ${result.length} campaigns.`);
    } catch (err) {
      console.error('❌ Error:', err.message);
      if (err.response?.data) {
        console.error('   Error Data:', JSON.stringify(err.response.data));
      }
    }
  }
}

debugAds().catch(console.error);
