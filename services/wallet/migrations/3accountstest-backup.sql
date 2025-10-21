-- ================================================
-- 3accountstest Database Backup
-- ================================================
-- Created: 2025-10-21
-- Purpose: Full snapshot of wallet database with 3 test accounts
-- Environment: Development/Testing
-- 
-- SECURITY WARNING: This backup includes encrypted private keys
-- Do NOT share this file or commit to public repositories
-- Use only for local development and testing
-- ================================================

-- Usage:
-- 1. Create fresh database: createdb paypay_wallet_3accountstest
-- 2. Restore: psql -d paypay_wallet_3accountstest -f 3accountstest-backup.sql
-- 3. Update DATABASE_URL in .env to point to new database
-- ================================================

\echo '🔄 Starting 3accountstest database restoration...'

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Drop existing tables (if recreating)
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "wallets" CASCADE;

-- Create wallets table
CREATE TABLE IF NOT EXISTS "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "address" TEXT NOT NULL UNIQUE,
    "encryptedKey" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'sepolia',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "gasUsed" TEXT,
    "gasPrice" TEXT,
    "nonce" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") 
        REFERENCES "wallets"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "wallets_userId_idx" ON "wallets"("userId");
CREATE INDEX IF NOT EXISTS "wallets_address_idx" ON "wallets"("address");
CREATE INDEX IF NOT EXISTS "transactions_walletId_idx" ON "transactions"("walletId");
CREATE INDEX IF NOT EXISTS "transactions_txHash_idx" ON "transactions"("txHash");
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status");

\echo '✅ Schema created'

-- ================================================
-- INSERT TEST DATA
-- ================================================
-- Note: This is SAMPLE data structure only
-- Real private keys and transaction hashes are NOT included
-- You must create real wallets via the API
-- ================================================

-- Wallet 1: July Skaya (july.skaya.by@gmail.com)
-- IMPORTANT: Replace 'ENCRYPTED_KEY_PLACEHOLDER' with real encrypted key from API
INSERT INTO "wallets" ("id", "userId", "address", "encryptedKey", "network", "createdAt")
VALUES (
    'a34d46ca-03d4-49fe-a9a7-ee55bba35ead',
    'google-july-skaya',
    '0x3240184c55c1CE9Ab75e20A18d466CA141a0685d',
    'ENCRYPTED_KEY_PLACEHOLDER_DO_NOT_USE',
    'sepolia',
    '2025-10-21 01:06:12.647'
) ON CONFLICT ("userId") DO NOTHING;

\echo '✅ Wallet 1 created (july.skaya)'

-- Sample transactions for testing
-- Note: Replace with real transaction hashes when syncing from blockchain
INSERT INTO "transactions" ("id", "walletId", "type", "from", "to", "amount", "txHash", "status", "blockNumber", "gasUsed", "gasPrice", "nonce", "createdAt")
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    'a34d46ca-03d4-49fe-a9a7-ee55bba35ead',
    'receive',
    '0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd',
    '0x3240184c55c1CE9Ab75e20A18d466CA141a0685d',
    '0.002',
    '0xSAMPLE_TX_HASH_1_REPLACE_WITH_REAL',
    'completed',
    5234567,
    '21000',
    '20000000000',
    1,
    '2025-10-21 01:15:00.000'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'a34d46ca-03d4-49fe-a9a7-ee55bba35ead',
    'receive',
    '0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd',
    '0x3240184c55c1CE9Ab75e20A18d466CA141a0685d',
    '0.001',
    '0xSAMPLE_TX_HASH_2_REPLACE_WITH_REAL',
    'completed',
    5234580,
    '21000',
    '19000000000',
    2,
    '2025-10-21 01:20:00.000'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'a34d46ca-03d4-49fe-a9a7-ee55bba35ead',
    'receive',
    '0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd',
    '0x3240184c55c1CE9Ab75e20A18d466CA141a0685d',
    '0.001',
    '0xSAMPLE_TX_HASH_3_REPLACE_WITH_REAL',
    'completed',
    5234590,
    '21000',
    '21000000000',
    3,
    '2025-10-21 01:25:00.000'
) ON CONFLICT ("txHash") DO NOTHING;

\echo '✅ Sample transactions created'

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

\echo ''
\echo '📊 Database Summary:'
\echo '=================='

SELECT 
    COUNT(*) as wallet_count,
    STRING_AGG(DISTINCT "userId", ', ') as user_ids
FROM "wallets";

\echo ''
\echo 'Wallet Details:'
SELECT 
    "userId",
    "address",
    "network",
    "createdAt"
FROM "wallets"
ORDER BY "createdAt" DESC;

\echo ''
\echo 'Transaction Summary:'
SELECT 
    w."userId",
    COUNT(t.*) as transaction_count,
    SUM(CASE WHEN t."type" = 'receive' THEN 1 ELSE 0 END) as received,
    SUM(CASE WHEN t."type" = 'send' THEN 1 ELSE 0 END) as sent
FROM "wallets" w
LEFT JOIN "transactions" t ON w."id" = t."walletId"
GROUP BY w."userId";

\echo ''
\echo '✅ 3accountstest database restoration complete!'
\echo ''
\echo '🔧 Next Steps:'
\echo '1. Create wallet for yulia.kanapatskaya: POST /api/wallet with x-user-id: google-oauth2|109775948151955395570'
\echo '2. Sync real transactions from blockchain: POST /api/wallet/sync-incoming'
\echo '3. Fund wallets from Sepolia faucet if needed'
\echo ''
\echo '⚠️  IMPORTANT: The encrypted keys in this backup are PLACEHOLDERS'
\echo '   Create real wallets via the API for actual testing'
\echo ''

