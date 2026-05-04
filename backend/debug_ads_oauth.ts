import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function testToken(email: string) {
  console.log(`\n========================================`);
  console.log(`[Step 1] ค้นหาบัญชี Google Ads Integration ของ: ${email}`);
  
  const account = await prisma.googleAdsAccount.findFirst({
    where: {
      tenant: {
        users: {
          some: { email: email }
        }
      }
    }
  });

  if (!account) {
    console.log("-> ไม่พบบัญชี (No Account Found)");
    return;
  }

  console.log(`-> พบบัญชีในฐานข้อมูล! (Customer ID: ${account.customerId})`);
  console.log(`-> Refresh Token ถูกบันทึกไว้หรือไม่? : ${account.refreshToken ? "มี" : "ไม่มี"} (ความยาว ${account.refreshToken?.length || 0})`);

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  
  console.log(`\n[Step 2] ทดสอบแลกเปลี่ยน Refresh Token เป็น Access Token ผ่าน Google OAuth API...`);
  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: account.refreshToken,
            grant_type: 'refresh_token'
        }
    });
    console.log(`-> สำเร็จ! Google อนุมัติ Access Token ใหม่ (ลงท้ายด้วย ...${tokenResponse.data.access_token.substring(tokenResponse.data.access_token.length - 10)})`);
    
    console.log(`\n[Step 3] นำ Access Token ใหม่ไปดึงข้อมูลแคมเปญจาก Google Ads API ทันที...`);
    const cleanCustomerId = (account.loginCustomerId || account.customerId).replace(/-/g, '');
    const query = `SELECT campaign.id, campaign.status, campaign.name FROM campaign LIMIT 5`;

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
     
    console.log(`-> สำเร็จ! ดึงข้อมูลจาก Google Ads API ได้ (HTTP Status: ${adsResponse.status})`);
    
    // Parse response
    const results = adsResponse.data.map((chunk: any) => chunk.results).flat().filter(Boolean);
    console.log(`-> ค้นพบแคมเปญจำนวน: ${results.length} ตัว (แสดงตัวอย่างด้านล่าง)`);
    results.forEach((row: any, i: number) => {
        console.log(`   ${i + 1}. ชื่อ: ${row.campaign.name} (สถานะ: ${row.campaign.status})`);
    });

  } catch (err: any) {
    console.log(`-> ล้มเหลว (FAILED)`);
    if (err.response) {
       console.log(`   HTTP Status: ${err.response.status}`);
       if (err.response.status === 400 && err.response.data?.error === 'invalid_grant') {
           console.log(`   บทสรุป: "invalid_grant" หมายถึงระบบเราติดต่อ Google ได้ถูกต้อง แต่ Google ปฏิเสธ Token นี้เพราะมัน "หมดอายุ", "ถูกเพิกถอน", หรือมาจาก "Testing App ที่เกิน 7 วัน"`);
       } else if (err.response.status === 401 || err.response.status === 403) {
           console.log(`   บทสรุป: Access Token ใช้ได้ แต่เจอ "unauthorized" จาก Google Ads API อาจเป็นเพราะ Customer ID ผิด, Developer Token ผิด หรืออีเมลไม่มีสิทธิ์ดูข้อมูล`);
       }
       console.log(`   รายละเอียด Error จาก Google:`, JSON.stringify(err.response.data, null, 2));
    } else {
       console.log(`   Error:`, err.message);
    }
  }
}

async function main() {
   // Test the working account
   await testToken('testuser@gmail.com');
   
   // Test the failing account
   await testToken('gear.wcr1@gmail.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
