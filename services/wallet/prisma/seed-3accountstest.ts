/**
 * Seed file for 3accountstest migration
 * 
 * This recreates the test environment with:
 * - 2 active wallets with real addresses
 * - Sample transactions for testing
 * - Multi-account testing setup
 * 
 * IMPORTANT: This does NOT include real private keys
 * You'll need to create new wallets via the API for actual testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding 3accountstest data...');

  // Clear existing test data (optional - comment out if you want to keep existing)
  console.log('Clearing existing test data...');
  await prisma.transaction.deleteMany({
    where: {
      wallet: {
        userId: {
          in: ['test-user-1', 'google-july-skaya', 'google-oauth2|109775948151955395570']
        }
      }
    }
  });
  
  await prisma.wallet.deleteMany({
    where: {
      userId: {
        in: ['test-user-1', 'google-july-skaya', 'google-oauth2|109775948151955395570']
      }
    }
  });

  // Create Wallet 1: July Skaya (Active wallet with transactions)
  console.log('Creating july.skaya wallet...');
  const julySkyaWallet = await prisma.wallet.create({
    data: {
      userId: 'google-july-skaya',
      address: '0x3240184c55c1CE9Ab75e20A18d466CA141a0685d',
      encryptedKey: 'PLACEHOLDER_DO_NOT_USE_IN_PRODUCTION', // Will be replaced when wallet is created via API
      network: 'sepolia',
    },
  });

  console.log(`✅ Created wallet for july.skaya: ${julySkyaWallet.address}`);

  // Create sample transactions for july.skaya wallet
  console.log('Creating sample transactions...');
  
  const sampleTransactions = [
    {
      walletId: julySkyaWallet.id,
      type: 'receive',
      from: '0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd',
      to: julySkyaWallet.address,
      amount: '0.002',
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'completed',
      blockNumber: 5234567,
      gasUsed: '21000',
      gasPrice: '20000000000',
      nonce: 1,
    },
    {
      walletId: julySkyaWallet.id,
      type: 'receive',
      from: '0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd',
      to: julySkyaWallet.address,
      amount: '0.001',
      txHash: '0x2234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'completed',
      blockNumber: 5234580,
      gasUsed: '21000',
      gasPrice: '19000000000',
      nonce: 2,
    },
    {
      walletId: julySkyaWallet.id,
      type: 'receive',
      from: '0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd',
      to: julySkyaWallet.address,
      amount: '0.001',
      txHash: '0x3234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'completed',
      blockNumber: 5234590,
      gasUsed: '21000',
      gasPrice: '21000000000',
      nonce: 3,
    },
  ];

  for (const tx of sampleTransactions) {
    await prisma.transaction.create({ data: tx });
  }

  console.log(`✅ Created ${sampleTransactions.length} sample transactions`);

  // Note: Initial test wallet (0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd) 
  // has 111+ real transactions on Sepolia testnet
  // These can be synced via the API: POST /api/wallet/sync-incoming

  console.log('\n📊 Seed Summary:');
  console.log('================');
  console.log('✅ Wallet 1 (july.skaya): 0x3240...685d - 3 transactions');
  console.log('ℹ️  Wallet 2 (yulia.kanapatskaya): No wallet yet - create via API');
  console.log('ℹ️  Initial test wallet: 0xd175...ccdd - 111+ real transactions on Sepolia');
  console.log('\n🔧 Next Steps:');
  console.log('1. Create wallet for yulia.kanapatskaya via: POST /api/wallet with x-user-id: google-oauth2|109775948151955395570');
  console.log('2. Fund wallets from Sepolia faucet if needed');
  console.log('3. Sync real transactions: POST /api/wallet/sync-incoming');
  console.log('\n✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

