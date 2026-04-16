const axios = require('axios');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('✅ .env loaded');
} else {
    console.log('❌ .env not found at', envPath);
    process.exit(1);
}

async function testConnection() {
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || 'MISSING'; // Use any refresh token from DB if you have one
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? process.env.GOOGLE_ADS_DEVELOPER_TOKEN.trim().replace(/^"|"$/g, '') : 'MISSING';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    console.log('--- DIAGNOSTIC START ---');
    console.log('Dev Token Length:', developerToken.length);
    if (developerToken.startsWith('-')) console.log('⚠️ Token starts with dash');

    // 1. Get Access Token
    let accessToken = '';
    try {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        // Note: We need a VALID refresh token to test real Google Ads API
        // If we don't have one, we can only test URL existence (which will give 401/403 instead of 404)
        console.log('Attempting to get access token...');
        // mock for now if no refresh token (to just test URL connectivity)
        accessToken = 'dummy'; 
    } catch (e) {
        console.log('OAuth Setup Error:', e.message);
    }

    const versions = ['v18', 'v17', 'v16'];
    const hosts = ['googleads.googleapis.com', 'google-ads.googleapis.com'];

    for (const host of hosts) {
        for (const ver of versions) {
            const url = `https://${host}/${ver}/customers:listAccessibleCustomers`;
            console.log(`Testing: ${url}`);
            
            try {
                const res = await axios.get(url, {
                    headers: {
                        'developer-token': developerToken,
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    timeout: 5000
                });
                console.log(`✅ ${ver}@${host} SUCCESS: ${res.status}`);
            } catch (err) {
                const status = err.response?.status;
                const data = err.response?.data;
                console.log(`❌ ${ver}@${host} FAILED: ${status || err.message}`);
                // IF we get 401 or 403, it means the URL is VALID but the token is the issue.
                // IF we get 404, it means the URL is INVALID.
                if (status === 401 || status === 403) {
                    console.log(`   💡 URL is VALID (Endpoint exists)`);
                }
                if (data) {
                    console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}`);
                }
            }
        }
    }
    console.log('--- DIAGNOSTIC END ---');
}

testConnection();
