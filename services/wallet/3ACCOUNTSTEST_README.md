# 3accountstest Migration

**Created:** October 21, 2025  
**Purpose:** Preserve and recreate the 3-account test environment  
**Type:** Database snapshot for testing multi-account wallet functionality

---

## 📊 What This Migration Includes

This migration captures the state of the wallet database with:

### **Account 1: july.skaya.by@gmail.com**
- **User ID**: `google-july-skaya`
- **Wallet Address**: `0x3240184c55c1CE9Ab75e20A18d466CA141a0685d`
- **Network**: Ethereum Sepolia Testnet
- **Balance**: 0.004 ETH
- **Transactions**: 3+ sample transactions
- **Status**: ✅ Active

### **Account 2: yulia.kanapatskaya@gmail.com**
- **User ID**: `google-oauth2|109775948151955395570`
- **Wallet**: None (to be created via API)
- **Status**: 🟡 Account exists, no wallet

### **Account 3: Initial Test Wallet**
- **Address**: `0xd17568EA5123a14908EC3edB3f3f51cEd6A2ccdd`
- **Transactions**: 111+ real transactions on Sepolia
- **Status**: ✅ External wallet (not in database)
- **Note**: Used for sending test transactions

---

## 🚀 Quick Start

### **Option 1: Using Prisma Seed (Recommended)**

```bash
# 1. Navigate to wallet service
cd backend/services/wallet

# 2. Run the seed file
npx ts-node prisma/seed-3accountstest.ts

# 3. Verify data
npx prisma studio
```

### **Option 2: Using SQL Backup**

```bash
# 1. Create a new test database
createdb paypay_wallet_3accountstest

# 2. Restore from backup
psql -d paypay_wallet_3accountstest -f migrations/3accountstest-backup.sql

# 3. Update your .env file
DATABASE_URL="postgresql://paypay:paypay123@localhost:5432/paypay_wallet_3accountstest"

# 4. Restart wallet service
cd backend
yarn workspace wallet start:dev
```

### **Option 3: Fresh Migration**

```bash
# 1. Navigate to wallet service
cd backend/services/wallet

# 2. Create migration
npx prisma migrate dev --name 3accountstest

# 3. Run seed
npx ts-node prisma/seed-3accountstest.ts
```

---

## 📁 Files Included

### **1. `prisma/migrations/20251021_3accountstest/migration.sql`**
- Database schema migration
- Index creation
- Documentation of test state

### **2. `prisma/seed-3accountstest.ts`**
- TypeScript seed file
- Creates sample wallets and transactions
- Safe to run multiple times
- **Does NOT include real private keys**

### **3. `migrations/3accountstest-backup.sql`**
- Full SQL backup
- Includes schema creation
- Sample data structure
- Verification queries

### **4. `3ACCOUNTSTEST_README.md`** (this file)
- Documentation
- Usage instructions
- Recovery procedures

---

## ⚠️ Important Security Notes

### **Private Keys**
- ❌ **Real private keys are NOT included** in this migration
- 🔒 Private keys are encrypted and should never be committed to git
- ✅ Use the API to create real wallets: `POST /api/wallet`

### **Transaction Data**
- Sample transactions use placeholder hashes
- Real transaction data must be synced from blockchain
- Use `POST /api/wallet/sync-incoming` to sync real transactions

### **Production Use**
- 🚫 **DO NOT** use this migration in production
- 🚫 **DO NOT** commit files with real encrypted keys
- ✅ This is for development/testing only

---

## 🔧 After Restoration

### **Step 1: Verify Database**

```bash
# Check wallet service
curl http://localhost:5006/api/wallet \
  -H "x-user-id: google-july-skaya" | jq

# Expected output:
# {
#   "id": "a34d46ca-03d4-49fe-a9a7-ee55bba35ead",
#   "userId": "google-july-skaya",
#   "address": "0x3240184c55c1CE9Ab75e20A18d466CA141a0685d",
#   "balance": "0.004",
#   "network": "sepolia",
#   "createdAt": "2025-10-21T01:06:12.647Z"
# }
```

### **Step 2: Create Missing Wallet**

```bash
# Create wallet for yulia.kanapatskaya
curl -X POST http://localhost:5006/api/wallet \
  -H "Content-Type: application/json" \
  -H "x-user-id: google-oauth2|109775948151955395570"
```

### **Step 3: Sync Real Transactions**

```bash
# Sync incoming transactions from blockchain
curl -X POST http://localhost:5006/api/wallet/sync-incoming \
  -H "x-user-id: google-july-skaya"
```

### **Step 4: Fund Wallets (if needed)**

Use Sepolia faucets to fund wallets:
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia
- https://faucets.chain.link/sepolia

---

## 🧪 Testing Scenarios

### **Scenario 1: Multi-Account Login**
```bash
# Test switching between accounts in frontend
# 1. Login as july.skaya.by@gmail.com
# 2. View wallet and transactions
# 3. Logout
# 4. Login as yulia.kanapatskaya@gmail.com
# 5. Create wallet or view existing
```

### **Scenario 2: Send Transaction**
```bash
# Send from july.skaya to yulia.kanapatskaya
curl -X POST http://localhost:5006/api/wallet/send \
  -H "Content-Type: application/json" \
  -H "x-user-id: google-july-skaya" \
  -d '{
    "to": "YULIA_WALLET_ADDRESS",
    "amount": "0.001"
  }'
```

### **Scenario 3: Transaction History**
```bash
# View transaction history for each account
curl http://localhost:5006/api/wallet/transactions \
  -H "x-user-id: google-july-skaya" | jq
```

---

## 🔄 Rollback Procedure

If you need to revert to the original database:

```bash
# 1. Backup current state (if needed)
pg_dump paypay_wallet > backup_before_rollback.sql

# 2. Drop and recreate database
dropdb paypay_wallet
createdb paypay_wallet

# 3. Run original migrations
cd backend/services/wallet
npx prisma migrate deploy

# 4. Run original seed (if exists)
npx ts-node prisma/seed.ts
```

---

## 📊 Database Statistics

### **Tables:**
- `wallets` - 1-2 records (depending on if yulia created wallet)
- `transactions` - 3+ records (sample + real synced transactions)

### **Indexes:**
- `wallets_userId_idx` - For fast user lookups
- `wallets_address_idx` - For blockchain queries
- `transactions_walletId_idx` - For transaction history
- `transactions_txHash_idx` - For transaction verification
- `transactions_status_idx` - For status filtering

### **Data Size:**
- Wallets: ~500 bytes per wallet
- Transactions: ~300 bytes per transaction
- Total: <10KB for test data

---

## 🐛 Troubleshooting

### **Issue: Migration already exists**
```bash
# Solution: Reset migrations
npx prisma migrate reset
npx prisma migrate deploy
npx ts-node prisma/seed-3accountstest.ts
```

### **Issue: Database connection error**
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### **Issue: Seed fails with "wallet already exists"**
```bash
# Solution: Clear test data first
psql $DATABASE_URL -c "DELETE FROM transactions WHERE \"walletId\" IN (SELECT id FROM wallets WHERE \"userId\" LIKE 'google%');"
psql $DATABASE_URL -c "DELETE FROM wallets WHERE \"userId\" LIKE 'google%';"

# Then run seed again
npx ts-node prisma/seed-3accountstest.ts
```

### **Issue: Private key placeholder error**
This is expected! The seed file uses placeholders.

**Solution:** Create real wallets via API:
```bash
curl -X POST http://localhost:5006/api/wallet \
  -H "x-user-id: google-july-skaya"
```

---

## 📚 Related Documentation

- **Frontend Review**: `/frontend/FRONTEND_REVIEW.md`
- **Backend Review**: `/backend/BACKEND_REVIEW.md`
- **Test Wallets Guide**: `/TEST_WALLETS_GUIDE.md`
- **Testing Summary**: `/WALLET_TESTING_SUMMARY.md`

---

## 🎯 Use Cases

1. **Onboarding New Developers**
   - Clone repo
   - Run 3accountstest migration
   - Have working test environment immediately

2. **Testing Features**
   - Multi-account functionality
   - Transaction history
   - Send/receive flows
   - Balance updates

3. **Bug Reproduction**
   - Recreate exact test state
   - Reproduce issues consistently
   - Test fixes against known state

4. **Performance Testing**
   - Baseline with 3 accounts
   - Scale up with more test accounts
   - Measure query performance

---

## ✅ Verification Checklist

After running migration:

- [ ] Database schema exists
- [ ] Indexes are created
- [ ] july.skaya wallet exists
- [ ] Sample transactions exist
- [ ] Wallet service connects successfully
- [ ] API endpoints respond correctly
- [ ] Frontend can fetch wallet data
- [ ] Can create new wallet for yulia.kanapatskaya
- [ ] Can send test transaction
- [ ] Can view transaction history

---

## 🎉 Success!

You now have a reproducible 3-account test environment!

**Next Steps:**
1. Test multi-account features
2. Create wallet for yulia.kanapatskaya
3. Send test transactions between accounts
4. Verify real-time updates in frontend

---

**Questions or Issues?**
Check the troubleshooting section above or refer to the related documentation files.

