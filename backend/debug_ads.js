const { GoogleAdsApi } = require('google-ads-api');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testAdsConnection() {
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });

  console.log('Testing Google Ads API Connection...');
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('Developer Token:', process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? 'SET' : 'MISSING');

  // Note: We can't easily test OAuth without a real refresh token in this script
  // but we can check if the client initializes.
  
  try {
    console.log('Client initialized successfully.');
    // If we had a refresh token from the DB, we could test listAccessibleCustomers
  } catch (err) {
    console.error('Initialization Error:', err.message);
  }
}

testAdsConnection();
