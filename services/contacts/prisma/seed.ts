import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding contacts database...');

  // Default user ID (from your current profile)
  const DEFAULT_USER_ID = 'user-1';

  // Clean existing data
  await prisma.contact.deleteMany({});

  // Create seed contacts (matching your frontend mock data)
  const contacts = await prisma.contact.createMany({
    data: [
      {
        id: '1',
        userId: DEFAULT_USER_ID,
        name: 'Main Exchange',
        address: '0x8f3d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
        note: 'Primary trading account',
      },
      {
        id: '2',
        userId: DEFAULT_USER_ID,
        name: 'Backup Exchange',
        address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      },
      {
        id: '3',
        userId: DEFAULT_USER_ID,
        name: 'Hardware Wallet',
        address: '0x7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
        note: 'Cold storage',
      },
      {
        id: '4',
        userId: DEFAULT_USER_ID,
        name: 'Alice',
        address: '0x9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
      },
      {
        id: '5',
        userId: DEFAULT_USER_ID,
        name: 'Bob',
        address: '0x2f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
      },
      {
        id: '6',
        userId: DEFAULT_USER_ID,
        name: 'Company Treasury',
        address: '0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      },
      {
        id: '7',
        userId: DEFAULT_USER_ID,
        name: 'Quick Wallet',
        address: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
      },
    ],
  });

  console.log(`✅ Created ${contacts.count} contacts for user ${DEFAULT_USER_ID}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

