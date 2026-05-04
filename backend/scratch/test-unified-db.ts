import { PrismaClient } from '@prisma/client';

async function main() {
  // ทดสอบรูปแบบ Unified Pooler (พอร์ต 6543)
  const unifiedUrl = "postgresql://postgres.lbyodfrbdwtbezyyilhu:iSjPjSQZGQx6Qdxy@db.lbyodfrbdwtbezyyilhu.supabase.co:6543/postgres?pgbouncer=true";
  console.log('--- TESTING UNIFIED POOLER (PORT 6543) ---');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: unifiedUrl,
      },
    },
  });

  try {
     const result = await prisma.$queryRaw`SELECT 1 as result`;
     console.log('✅ Unified Pooler Successful:', result);
  } catch (e: any) {
     console.error('❌ Unified Pooler Failed:', e.message);
  } finally {
     await prisma.$disconnect();
  }
}

main();
