const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(process.cwd(), '.env');
console.log('Current working directory:', process.cwd());
console.log('Target .env path:', envPath);
console.log('File exists?', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('--- GOOGLE ADS CONFIG ---');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_REDIRECT_URI_ADS:', process.env.GOOGLE_REDIRECT_URI_ADS);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('-------------------------');
} else {
    console.log('Could not find .env file');
}
