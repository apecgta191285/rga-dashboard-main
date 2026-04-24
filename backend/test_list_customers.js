const axios = require('axios');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

async function test() {
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN; // Get this from DB or input
    if (!refreshToken) {
        console.log('No GOOGLE_ADS_REFRESH_TOKEN found in .env');
        return;
    }

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN.trim().replace(/^"|"$/g, '');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { token } = await oauth2Client.getAccessToken();

    const url = 'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers';
    console.log('Testing GET:', url);
    console.log('Dev Token:', devToken.substring(0, 5) + '...');

    try {
        const res = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'developer-token': devToken
            }
        });
        console.log('SUCCESS:', res.data);
    } catch (err) {
        console.log('FAILED:', err.response?.status);
        console.log('DATA:', JSON.stringify(err.response?.data, null, 2));
    }
}

test();
