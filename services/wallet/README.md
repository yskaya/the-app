# Wallet Microservice

A NestJS-based microservice for managing Ethereum wallets on Sepolia testnet using ethers.js v6.

## Features

- **Wallet Management**: Create custodial Ethereum wallets for users
- **Real Blockchain Integration**: Connects to Sepolia testnet via Infura
- **Transaction Support**: Send ETH transactions with automatic confirmation tracking
- **Security**: AES-256-GCM encryption for private keys
- **Caching**: Redis-based balance caching for performance
- **Database**: PostgreSQL with Prisma ORM

## Prerequisites

1. **Infura API Key** (Required for Sepolia RPC)
   - Sign up at https://infura.io (free tier available)
   - Create a project and copy the API key

2. **PostgreSQL Database**
   - Database: `paypay`
   - User: `paypay`
   - Password: `paypay`

3. **Redis**
   - Host: `localhost`
   - Port: `6379`

## Setup

### 1. Install Dependencies

```bash
cd backend/services/wallet
yarn install --ignore-engines
```

Note: `--ignore-engines` flag is required due to Node.js version compatibility with @noble/hashes dependency.

### 2. Configure Environment

Create `.env` file:

```env
DATABASE_URL="postgresql://paypay:paypay@localhost:5432/paypay?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY"
WALLET_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
HTTP_WALLET_PORT=5006
```

**Important**:
- Replace `YOUR_INFURA_API_KEY` with your actual Infura API key
- Generate a new 64-character hex string for `WALLET_ENCRYPTION_KEY` in production
- Keep these values secret!

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migration

```bash
npx prisma migrate dev --name init
```

This creates two tables:
- `wallets`: Stores user wallets with encrypted private keys
- `transactions`: Stores transaction history

### 5. Build the Service

```bash
yarn build
```

### 6. Start the Service

Development mode (with hot reload):
```bash
yarn start:dev
```

Production mode:
```bash
yarn start
```

Service runs on **http://localhost:5006**

## API Endpoints

### Create Wallet
**POST** `/api/wallet`

Headers:
- `x-user-id`: User ID (string)

Response:
```json
{
  "id": "wallet-uuid",
  "userId": "user-1",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "balance": "0.0",
  "network": "sepolia",
  "createdAt": "2025-01-20T15:30:00Z"
}
```

### Get Wallet
**GET** `/api/wallet`

Headers:
- `x-user-id`: User ID (string)

Response: Same as Create Wallet

### Send Transaction
**POST** `/api/wallet/send`

Headers:
- `x-user-id`: User ID (string)

Body:
```json
{
  "to": "0x9876543210987654321098765432109876543210",
  "amount": "0.01"
}
```

Response:
```json
{
  "transactionId": "tx-uuid",
  "txHash": "0xabc123...",
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "to": "0x9876543210987654321098765432109876543210",
  "amount": "0.01",
  "status": "pending",
  "nonce": 0
}
```

### Get Transactions
**GET** `/api/wallet/transactions?limit=50`

Headers:
- `x-user-id`: User ID (string)

Query Parameters:
- `limit` (optional): Number of transactions to return (default: 50)

Response:
```json
[
  {
    "id": "tx-uuid",
    "walletId": "wallet-uuid",
    "type": "send",
    "from": "0x742d...",
    "to": "0x9876...",
    "amount": "0.01",
    "txHash": "0xabc123...",
    "status": "completed",
    "blockNumber": 12345,
    "gasUsed": "21000",
    "gasPrice": "20000000000",
    "nonce": 0,
    "createdAt": "2025-01-20T15:30:00Z"
  }
]
```

## Testing

### Unit Tests

```bash
yarn test
```

### Get Test ETH

1. Create a wallet via the API
2. Copy the wallet address from the response
3. Visit https://sepoliafaucet.com
4. Paste your wallet address
5. Request 0.5 test ETH
6. Wait 1-2 minutes for confirmation

### Manual API Testing

```bash
# Create wallet
curl -X POST http://localhost:5006/api/wallet \
  -H "x-user-id: user-1"

# Get wallet (after creating)
curl http://localhost:5006/api/wallet \
  -H "x-user-id: user-1"

# Send transaction (after getting test ETH)
curl -X POST http://localhost:5006/api/wallet/send \
  -H "x-user-id: user-1" \
  -H "Content-Type: application/json" \
  -d '{"to": "0x9876543210987654321098765432109876543210", "amount": "0.01"}'

# Get transactions
curl http://localhost:5006/api/wallet/transactions \
  -H "x-user-id: user-1"
```

## Architecture

### Security

**Private Key Encryption:**
- Uses AES-256-GCM for encryption
- Initialization Vector (IV) generated per encryption
- Authentication tag for integrity verification
- Encryption key stored in environment variable

**Never expose private keys in:**
- API responses
- Logs
- Error messages

### Transaction Flow

1. **Initiate**: User sends transaction request
2. **Validate**: Check address format and balance
3. **Sign**: Decrypt private key and sign transaction
4. **Broadcast**: Send to Sepolia network
5. **Record**: Store in database as "pending"
6. **Confirm**: Background job waits for confirmation
7. **Update**: Update status to "completed" or "failed"

### Caching Strategy

- **Balance**: Cached for 30 seconds in Redis
- **Cache Key**: `wallet:balance:{address}`
- **Invalidation**: On send transaction

## Production Considerations

### Security Improvements

1. **Hardware Wallet**: Use AWS KMS or hardware security module (HSM) for private keys
2. **Multi-Sig**: Require multiple signatures for large amounts
3. **Rate Limiting**: Implement per-user transaction limits
4. **Monitoring**: Set up alerts for unusual activity

### Network Migration

To move to Ethereum mainnet:

1. Update `.env`:
   ```env
   SEPOLIA_RPC_URL="https://mainnet.infura.io/v3/YOUR_KEY"
   ```

2. Update `schema.prisma`:
   ```prisma
   network String @default("mainnet")
   ```

3. Run migration:
   ```bash
   npx prisma migrate dev --name switch_to_mainnet
   ```

### Scaling

- **Horizontal**: Run multiple instances behind load balancer
- **Database**: Consider read replicas for high traffic
- **Background Jobs**: Use queue (Bull/BullMQ) for confirmation tracking

## Troubleshooting

### Database Connection Error

```
Error: P1000: Authentication failed
```

**Solution**: Verify PostgreSQL credentials in `.env` and ensure database exists.

### Infura Rate Limiting

```
Error: Too many requests
```

**Solution**: Upgrade Infura plan or implement request queueing.

### Transaction Stuck Pending

**Cause**: Network congestion or insufficient gas price

**Solution**: Check transaction on https://sepolia.etherscan.io using txHash

### Build Error: @noble/hashes

```
Error: The engine "node" is incompatible
```

**Solution**: Use `yarn install --ignore-engines`

## Development

### Project Structure

```
wallet/
├── src/
│   ├── wallet/
│   │   ├── wallet.service.ts      # Core wallet logic
│   │   ├── wallet.controller.ts   # REST API endpoints
│   │   ├── wallet.module.ts       # NestJS module
│   │   └── wallet.service.spec.ts # Unit tests
│   ├── prisma/
│   │   ├── prisma.service.ts      # Prisma client
│   │   └── prisma.module.ts       # Prisma module
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Entry point
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Database migrations
│   └── seed.ts                    # Seed data
├── package.json
├── tsconfig.json
└── README.md
```

### Adding ERC20 Token Support

See `docs/ERC20_INTEGRATION.md` for guide on adding USDC, USDT, and other ERC20 tokens.

## License

MIT

