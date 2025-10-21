import { PrismaClient } from '../node_modules/.prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding wallet database...');

  // Note: Wallets are created on-demand by users via the API
  // This seed file is here for future test data if needed

  console.log('✅ Wallet database seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

