# Backend MVP Checklist & Requirements
## What's Missing But Required for MVP Launch

**Date:** October 21, 2025  
**Purpose:** Action-oriented checklist for MVP readiness  
**Status:** 🔴 **NOT READY** - Critical blockers must be resolved

---

## 🚨 CRITICAL BLOCKERS (Must Fix Before Launch)

### 1. **Private Key Security** 🔴
**Current State:** ❌ Private keys stored in database (encrypted but vulnerable)  
**Risk:** Single database breach = all user funds lost  
**Effort:** 16-24 hours  
**Priority:** HIGHEST

**Required Actions:**
- [ ] **Option A (Quick MVP):** User password-based encryption
  - Store only encrypted keys with user-provided password
  - Password never stored in database
  - User must remember password (no recovery possible)
  
- [ ] **Option B (Recommended):** AWS KMS Integration
  - Move key encryption to AWS KMS
  - Database stores only KMS key IDs
  - Requires AWS account setup
  
- [ ] **Option C (Best):** Non-Custodial Approach
  - Users control their own keys (MetaMask-style)
  - Backend only signs with user approval
  - Most secure but requires browser extension

**Decision Needed:** Choose security approach before proceeding

---

### 2. **Environment Configuration** 🔴
**Current State:** ❌ No `.env.example` files  
**Risk:** Deployment failures, security misconfiguration  
**Effort:** 1 hour  
**Priority:** HIGH

**Missing Files:**

#### `/backend/.env.example`
```env
# API Gateway
PORT=5555
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/paypay

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
ACCESS_TOKEN_SECRET=your-access-secret-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### `/backend/services/wallet/.env.example`
```env
# Database
DATABASE_URL=postgresql://paypay:paypay@localhost:5432/paypay_wallet

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Ethereum
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Security
WALLET_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Service
HTTP_WALLET_PORT=5006
```

**Action Items:**
- [ ] Create `.env.example` files for all services
- [ ] Document all required environment variables
- [ ] Add validation on startup for missing vars
- [ ] Update README with setup instructions

---

### 3. **Incoming Transaction Monitoring** 🔴
**Current State:** ❌ Only placeholder code exists  
**Risk:** Users can't see received funds  
**Effort:** 8-12 hours  
**Priority:** HIGH

**Current Code (wallet.service.ts line 357-397):**
```typescript
async syncIncomingTransactions(userId: string) {
  // For now, we'll rely on manual sync
  // TODO: Use Etherscan API
  return { message: 'Incoming transaction sync completed' };
}
```

**Required Implementation:**

```typescript
import Etherscan from '@ethereum/etherscan-api';

async syncIncomingTransactions(userId: string) {
  const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
  
  // 1. Initialize Etherscan API
  const etherscan = new Etherscan(process.env.ETHERSCAN_API_KEY);
  
  // 2. Fetch transactions from blockchain
  const transactions = await etherscan.account.txlist(
    wallet.address,
    1, // startblock
    99999999, // endblock
    'asc' // sort
  );
  
  // 3. Filter incoming transactions
  const incoming = transactions.result.filter(tx => 
    tx.to.toLowerCase() === wallet.address.toLowerCase()
  );
  
  // 4. Get existing tx hashes
  const existingTxs = await this.prisma.transaction.findMany({
    where: { walletId: wallet.id },
    select: { txHash: true }
  });
  const existingHashes = new Set(existingTxs.map(tx => tx.txHash));
  
  // 5. Insert missing transactions
  let newCount = 0;
  for (const tx of incoming) {
    if (!existingHashes.has(tx.hash)) {
      await this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'receive',
          from: tx.from,
          to: tx.to,
          amount: ethers.formatEther(tx.value),
          txHash: tx.hash,
          status: tx.isError === '0' ? 'completed' : 'failed',
          blockNumber: parseInt(tx.blockNumber),
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          nonce: parseInt(tx.nonce),
        }
      });
      newCount++;
    }
  }
  
  return {
    message: 'Sync completed',
    newTransactions: newCount,
    totalTransactions: incoming.length
  };
}
```

**Action Items:**
- [ ] Install `@ethereum/etherscan-api` package
- [ ] Implement full sync logic as shown above
- [ ] Add CRON job to auto-sync every 30 seconds
- [ ] Add webhook endpoint for instant notifications (optional)
- [ ] Test with multiple accounts and transactions

---

### 4. **Token Blacklisting** 🟡
**Current State:** ⚠️ TODO comment only  
**Risk:** Logged out users can still use old tokens  
**Effort:** 2-3 hours  
**Priority:** MEDIUM-HIGH

**Current Code (auth.service.ts line 80-83):**
```typescript
async logout(refreshToken: string) {
  // TODO: Invalidate refresh token in Redis via tokens
  // await this.grpcTokensService.invalidateRefreshToken(refreshToken);
}
```

**Required Implementation:**

```typescript
// auth.service.ts
async logout(refreshToken: string) {
  try {
    const decoded = jwt.decode(refreshToken) as { userId: string; jti: string };
    
    if (!decoded || !decoded.jti) {
      throw new UnauthorizedException('Invalid token');
    }
    
    // Add to blacklist with TTL matching token expiry
    const ttl = 2 * 24 * 60 * 60; // 2 days (refresh token lifetime)
    await this.redisService.set(
      `token:blacklist:${decoded.jti}`,
      'revoked',
      ttl
    );
    
    return { message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    throw new InternalServerErrorException('Logout failed');
  }
}
```

```typescript
// tokens.service.ts - Add blacklist check
async validateToken(token: string) {
  const decoded = jwt.decode(token) as { jti: string };
  
  // Check blacklist
  const isBlacklisted = await this.redisService.get(`token:blacklist:${decoded.jti}`);
  if (isBlacklisted) {
    throw new UnauthorizedException('Token has been revoked');
  }
  
  // Continue with validation...
}
```

**Action Items:**
- [ ] Implement blacklist logic in auth.service.ts
- [ ] Add blacklist check in tokens.service.ts
- [ ] Add `jti` (JWT ID) to token payload
- [ ] Test logout -> token usage (should fail)
- [ ] Add cleanup job for expired blacklist entries

---

## 🟡 IMPORTANT (Should Have for MVP)

### 5. **Proper Logging** 🟡
**Current State:** ⚠️ Using `console.log` everywhere  
**Risk:** No production logging, hard to debug  
**Effort:** 4 hours  
**Priority:** MEDIUM

**Current Issues:**
```typescript
// wallet.controller.ts - Everywhere!
console.log('!!!!! Wallet.create. userId=', userId);
console.log('!!!!! Wallet.send. userId=', userId, 'body=', body);
```

**Required Solution:**

```bash
npm install winston
npm install @types/winston --save-dev
```

```typescript
// shared/logger.service.ts
import * as winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('Wallet created', { userId, walletId, address });
logger.error('Transaction failed', { userId, error: error.message, stack: error.stack });
```

**Action Items:**
- [ ] Install Winston
- [ ] Create logger service
- [ ] Replace all console.log with logger
- [ ] Add correlation IDs to requests
- [ ] Configure log levels per environment

---

### 6. **Transaction Retry Logic** 🟡
**Current State:** ❌ No retry for failed transactions  
**Risk:** Transactions fail permanently on network issues  
**Effort:** 6 hours  
**Priority:** MEDIUM

**Required Implementation:**

```typescript
// wallet.service.ts
private async sendTransactionWithRetry(
  wallet: ethers.Wallet,
  to: string,
  amount: bigint,
  maxRetries = 3
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tx = await wallet.sendTransaction({
        to,
        value: amount,
        // Add EIP-1559 support
        maxFeePerGas: await this.provider.getFeeData().then(d => d.maxFeePerGas),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
      });
      
      return tx; // Success!
      
    } catch (error) {
      lastError = error;
      
      // Only retry on specific errors
      if (this.isRetryableError(error)) {
        const backoff = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      
      // Non-retryable error, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

private isRetryableError(error: any): boolean {
  const retryableCodes = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVER_ERROR',
    'NONCE_EXPIRED'
  ];
  
  return retryableCodes.some(code => error.code === code);
}
```

**Action Items:**
- [ ] Implement retry logic with exponential backoff
- [ ] Add retry counter to database
- [ ] Log retry attempts
- [ ] Add max retry configuration
- [ ] Test with network failures

---

### 7. **Rate Limiting Improvements** 🟡
**Current State:** ⚠️ Hardcoded dev limits in production code  
**Risk:** Security bypass or false positives  
**Effort:** 2 hours  
**Priority:** MEDIUM

**Current Issues (rate-limit.middleware.ts line 82-85):**
```typescript
private getRateLimits(endpoint: string) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  return isDevelopment 
    ? { requests: 1000, windowMs: 60 * 1000 } // ❌ Hardcoded
    : { requests: 5, windowMs: 15 * 60 * 1000 };
}
```

**Required Solution:**

```typescript
// config/rate-limits.config.ts
export const RATE_LIMITS = {
  auth: {
    login: {
      dev: { requests: 1000, windowMs: 60 * 1000 },
      prod: { requests: 5, windowMs: 15 * 60 * 1000 }
    },
    logout: {
      dev: { requests: 100, windowMs: 60 * 1000 },
      prod: { requests: 10, windowMs: 5 * 60 * 1000 }
    }
  },
  wallet: {
    send: {
      dev: { requests: 100, windowMs: 60 * 1000 },
      prod: { requests: 10, windowMs: 60 * 1000 }
    },
    default: {
      dev: { requests: 200, windowMs: 60 * 1000 },
      prod: { requests: 100, windowMs: 15 * 60 * 1000 }
    }
  }
};
```

**Action Items:**
- [ ] Extract rate limits to configuration file
- [ ] Make limits configurable via environment
- [ ] Add per-user limits (not just per-IP)
- [ ] Add daily transaction limits for wallet
- [ ] Document rate limits in API docs

---

### 8. **Health Checks** 🟡
**Current State:** ❌ No health check endpoints  
**Risk:** Can't monitor service status  
**Effort:** 2 hours  
**Priority:** MEDIUM

**Required Endpoints:**

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService
  ) {}

  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME,
      version: process.env.npm_package_version
    };
  }

  @Get('ready')
  async ready() {
    // Check all dependencies
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkEthereumRPC()
    ]);

    const failed = checks.filter(c => c.status === 'rejected');
    
    return {
      status: failed.length === 0 ? 'ready' : 'not_ready',
      checks: {
        database: checks[0].status === 'fulfilled',
        redis: checks[1].status === 'fulfilled',
        ethereum: checks[2].status === 'fulfilled'
      }
    };
  }

  private async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis() {
    await this.redis.ping();
  }

  private async checkEthereumRPC() {
    // For wallet service only
    await this.provider.getBlockNumber();
  }
}
```

**Action Items:**
- [ ] Add health check controller to all services
- [ ] Test health endpoints
- [ ] Configure load balancer health checks
- [ ] Add startup probes (k8s/docker)
- [ ] Monitor health endpoint availability

---

## 🟢 NICE TO HAVE (Post-MVP)

### 9. **API Documentation (Swagger)** 🟢
**Current State:** ❌ No auto-generated docs  
**Effort:** 3 hours  
**Priority:** LOW (but valuable)

```bash
npm install @nestjs/swagger
```

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('PayPay Wallet API')
  .setDescription('Crypto wallet microservices API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
  
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

---

### 10. **Database Migrations Cleanup** 🟢
**Current State:** ⚠️ Multiple migration files, some manual SQL  
**Effort:** 2 hours  
**Priority:** LOW

**Action Items:**
- [ ] Consolidate all migrations into single init
- [ ] Remove manual SQL files (like `link-wallet-to-google.sql`)
- [ ] Create proper seed files for test data
- [ ] Document migration strategy

---

### 11. **Error Monitoring (Sentry)** 🟢
**Current State:** ❌ No production error tracking  
**Effort:** 3 hours  
**Priority:** MEDIUM (important for production)

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Add to main.ts
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 📋 Complete MVP Checklist

### **Critical (Can't Launch Without)** 🔴

- [ ] **Private Key Security** (Choose and implement one approach)
  - [ ] Option A: User password encryption
  - [ ] Option B: AWS KMS integration
  - [ ] Option C: Non-custodial approach
  
- [ ] **Environment Configuration**
  - [ ] Create `.env.example` for root
  - [ ] Create `.env.example` for each service
  - [ ] Document all required variables
  - [ ] Add startup validation

- [ ] **Incoming Transaction Monitoring**
  - [ ] Install Etherscan API package
  - [ ] Implement sync logic
  - [ ] Add CRON job or polling
  - [ ] Test with multiple accounts

- [ ] **Token Blacklisting**
  - [ ] Implement logout blacklist
  - [ ] Add blacklist check in validation
  - [ ] Add JTI to tokens
  - [ ] Test logout flow

### **Important (Should Have)** 🟡

- [ ] **Proper Logging**
  - [ ] Install Winston
  - [ ] Replace all console.log
  - [ ] Add correlation IDs
  - [ ] Configure log levels

- [ ] **Transaction Retry Logic**
  - [ ] Implement retry with backoff
  - [ ] Add retryable error detection
  - [ ] Test failure scenarios

- [ ] **Rate Limiting Improvements**
  - [ ] Extract to configuration
  - [ ] Add per-user limits
  - [ ] Add transaction limits

- [ ] **Health Checks**
  - [ ] Add health endpoints
  - [ ] Check all dependencies
  - [ ] Configure monitoring

### **Nice to Have** 🟢

- [ ] API Documentation (Swagger)
- [ ] Database migrations cleanup
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring
- [ ] Distributed tracing

---

## 🚀 MVP Launch Readiness Score

### Current Score: **60/100** 🔴

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| **Security** | 40% | 50/100 | 20 |
| **Functionality** | 30% | 80/100 | 24 |
| **Reliability** | 20% | 60/100 | 12 |
| **Observability** | 10% | 40/100 | 4 |
| **TOTAL** | 100% | - | **60/100** |

### Minimum MVP Score Needed: **75/100** ✅

### To Reach MVP:
1. ✅ Fix private key security (+20 points) → 80/100
2. ✅ Add incoming tx monitoring (+10 points) → 90/100
3. ✅ Implement token blacklisting (+5 points) → 95/100

**Total Effort:** ~30-40 hours

---

## 📊 Service-by-Service Gaps

### **API Gateway** (Port 5555)
- ❌ No `.env.example`
- ❌ No health checks
- ⚠️ Hardcoded service URLs
- ✅ Rate limiting works

### **Auth Service** (Port 5001)
- ❌ No `.env.example`
- ❌ Token blacklisting incomplete
- ❌ No 2FA support
- ✅ Google OAuth works

### **Users Service** (Port 5002)
- ❌ No `.env.example`
- ✅ Basic CRUD works
- ⚠️ Minimal features

### **Tokens Service** (Port 5003)
- ❌ No `.env.example`
- ❌ No blacklist checking
- ✅ Token generation works

### **Contacts Service** (Port 5005)
- ✅ Well documented
- ✅ Good test coverage
- ✅ Redis caching
- ✅ Most complete service!

### **Wallet Service** (Port 5006)
- ❌ No `.env.example`
- ❌ Private key security issue
- ❌ No incoming tx monitoring
- ⚠️ No retry logic
- ✅ Blockchain integration works
- ✅ Has README

---

## 🎯 Recommended Implementation Order

### **Week 1: Critical Security** (24-30 hours)
**Day 1-2:** Private Key Security
- Research and decide on approach
- Implement chosen solution
- Test thoroughly
- **Blocker:** Can't launch without this

**Day 3:** Environment Configuration
- Create all `.env.example` files
- Document variables
- Add validation
- Test deployment

**Day 4-5:** Token Blacklisting
- Implement blacklist logic
- Add JTI to tokens
- Test logout flow
- Clean up old sessions

### **Week 2: Essential Features** (16-20 hours)
**Day 1-2:** Incoming Transaction Monitoring
- Install Etherscan API
- Implement sync logic
- Add CRON job
- Test with real transactions

**Day 3:** Proper Logging
- Install Winston
- Replace console.log
- Add correlation IDs
- Configure levels

**Day 4:** Health Checks
- Add endpoints to all services
- Configure monitoring
- Test health checks

### **Week 3: Testing & Polish** (16-20 hours)
**Day 1-2:** Comprehensive Testing
- Test all critical paths
- Load testing
- Security testing
- Fix bugs

**Day 3-4:** Documentation
- Update README files
- Add API documentation
- Create deployment guide
- Write runbooks

**Day 5:** Final Review
- Code review
- Security audit
- Performance check
- Deploy to staging

---

## 💰 MVP Cost Estimate

### **Development Time:**
- Critical fixes: 30-40 hours @ $100/hr = $3,000-4,000
- Important features: 16-20 hours @ $100/hr = $1,600-2,000
- Testing & polish: 16-20 hours @ $100/hr = $1,600-2,000
- **Total Development:** $6,200-8,000

### **Infrastructure (Monthly):**
- PostgreSQL: $25-50
- Redis: $15-30
- AWS KMS: $1 (first 20K operations free)
- Infura/Alchemy: $0-50
- Etherscan API: $0-99
- Sentry: $0-26 (free for <5K events)
- **Total Monthly:** $41-255

### **One-Time Costs:**
- Domain: $12/year
- SSL Certificate: $0 (Let's Encrypt)
- Google OAuth: $0
- **Total One-Time:** $12

---

## 🎉 Conclusion

### **Backend Status: 60% MVP Ready**

**Critical Blockers:**
1. 🔴 Private key security (MUST FIX)
2. 🔴 Environment configuration (MUST ADD)
3. 🟡 Incoming transaction monitoring (SHOULD ADD)
4. 🟡 Token blacklisting (SHOULD ADD)

**Time to MVP:** 30-40 hours of focused development

**Risk Level:** 🔴 **HIGH** (due to private key storage)

**Recommendation:** **DO NOT DEPLOY** until private key security is fixed!

---

**Next Steps:**
1. Review this checklist with team
2. Decide on private key approach
3. Create sprint plan for 3 weeks
4. Begin implementation in priority order
5. Conduct security review before launch

**Related Documents:**
- `/backend/BACKEND_REVIEW.md` - Detailed technical review
- `/frontend/FRONTEND_REVIEW.md` - Frontend assessment
- `/WALLET_TESTING_SUMMARY.md` - Testing progress

