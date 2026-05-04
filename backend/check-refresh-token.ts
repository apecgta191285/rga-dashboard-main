import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.googleAdsAccount.findFirst({
    where: {
      tenant: {
        users: {
          some: { email: 'gear.wcr1@gmail.com' }
        }
      }
    },
    include: {
      tenant: { select: { users: { select: { email: true } } } }
    }
  });

  if (account) {
    console.log(`Tenant emails: ${account.tenant.users.map(u => u.email).join(', ')}`);
    console.log(`Has Access Token? : ${!!account.accessToken}`);
    console.log(`Has Refresh Token?: ${!!account.refreshToken}`);
    // Check if refreshToken is empty string or valid
    console.log(`Refresh Token length: ${account.refreshToken ? account.refreshToken.length : 0}`);
    console.log(`Access Token expires at: ${account.tokenExpiresAt}`);
  } else {
    console.log("Account not found for gear.wcr1@gmail.com");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
