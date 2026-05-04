import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      emailVerified: true,
      isActive: true,
      failedLoginCount: true,
      lockedUntil: true,
    }
  });

  console.log('--- USER LIST ---');
  console.table(users);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
