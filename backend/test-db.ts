import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- DB CONNECTION TEST ---');
  try {
     const result = await prisma.$queryRaw`SELECT 1 as result`;
     console.log('✅ Connection Successful:', result);
  } catch (e) {
     console.error('❌ Connection Failed:', e);
  }
  process.exit(0);
}

main();
