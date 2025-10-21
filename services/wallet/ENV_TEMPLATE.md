# Wallet Service Environment Variables

Copy these to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://paypay:paypay@localhost:5432/paypay?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# Ethereum Network
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"

# Security (MUST CHANGE IN PRODUCTION!)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WALLET_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Service Configuration
HTTP_WALLET_PORT=5006
NODE_ENV=development
```

## Setup Instructions:

1. **Get Infura API Key** (if you don't have one):
   - Sign up at https://infura.io (free)
   - Create a project
   - Copy the Project ID
   - Replace `YOUR_INFURA_PROJECT_ID` above

2. **Get Etherscan API Key** (NEW - for incoming transaction monitoring):
   - Follow instructions in `/GET_ETHERSCAN_KEY.md`
   - Replace `YOUR_ETHERSCAN_API_KEY` above

3. **Create .env file:**
   ```bash
   cd /Users/ykanapatskaya/Workspace/paypay/backend/services/wallet
   # Copy the env variables above into .env file
   ```

4. **Restart service:**
   ```bash
   yarn start:dev
   ```

