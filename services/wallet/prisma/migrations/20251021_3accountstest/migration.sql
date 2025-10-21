-- Migration: 3accountstest
-- Description: Snapshot of wallet database with 3 test accounts (2 active wallets)
-- Date: 2025-10-21
-- Purpose: Preserve test data for multi-account testing scenarios

-- This migration represents the state of the database after initial testing with:
-- 1. Initial test wallet (0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd) - 111+ transactions
-- 2. july.skaya.by@gmail.com wallet (0x3240184c55c1CE9Ab75e20A18d466CA141a0685d) - Active
-- 3. yulia.kanapatskaya@gmail.com - Account exists, no wallet yet

-- Note: This migration file documents the test state but does NOT include sensitive data
-- (private keys, actual transaction data). Use the seed file for test data recreation.

-- Ensure schema is up to date
-- The schema should already exist from previous migrations
-- This migration is primarily for documentation and test data seeding purposes

-- Create indexes if they don't exist (idempotent)
CREATE INDEX IF NOT EXISTS "wallets_userId_idx" ON "wallets"("userId");
CREATE INDEX IF NOT EXISTS "wallets_address_idx" ON "wallets"("address");
CREATE INDEX IF NOT EXISTS "transactions_walletId_idx" ON "transactions"("walletId");
CREATE INDEX IF NOT EXISTS "transactions_txHash_idx" ON "transactions"("txHash");
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status");

-- Add any missing columns (if needed for backward compatibility)
-- This is safe to run multiple times

-- Note: To recreate the test environment, use:
-- npx prisma migrate deploy
-- npx ts-node prisma/seed-3accountstest.ts

