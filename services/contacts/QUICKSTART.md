# 🚀 Contacts Service - Quick Start

## Setup in 3 Steps

### 1️⃣ Install Dependencies
```bash
cd backend/services/contacts
yarn install
```

### 2️⃣ Setup Database
```bash
# Create .env file
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paypay_contacts?schema=public"' > .env

# Run migration (creates contacts table)
yarn prisma:migrate

# Seed with test data (7 contacts for user-1)
yarn prisma:seed
```

### 3️⃣ Start Service
```bash
yarn start:dev
```

✅ Service running on `http://localhost:5005`

---

## 🧪 Test It Works

### In another terminal:
```bash
# Get all contacts
curl http://localhost:5005/api/contacts -H "x-user-id: user-1"

# Should return 7 contacts (Alice, Bob, Main Exchange, etc.)
```

---

## 🔗 Connect to Frontend

### Option A: Direct Connection (Dev)
Update frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5005/api
```

### Option B: Through API Gateway (Production-like)
Add to `backend/services/api-gateway/src/proxy.middleware.ts`:
```typescript
{
  path: '/contacts',
  target: 'http://localhost:5005/api/contacts',
  method: 'ALL'
}
```

Then frontend uses:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 📁 Files Created

```
backend/services/contacts/
├── src/
│   ├── contacts/
│   │   ├── contacts.service.ts      ← Business logic
│   │   ├── contacts.controller.ts   ← REST endpoints
│   │   ├── contacts.module.ts       ← NestJS module
│   │   └── contacts.service.spec.ts ← Unit tests (Jest)
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma                ← Database schema
│   ├── seed.ts                      ← Seed data (7 contacts)
│   └── migrations/
│       └── 20250320000000_init/
│           └── migration.sql        ← Initial migration
├── package.json
├── tsconfig.json
├── jest.config.js
├── Dockerfile
├── README.md                        ← Full documentation
├── DB_STRUCTURE.md                  ← Database reference
└── QUICKSTART.md                    ← This file
```

---

## 🧪 Run Tests

```bash
# Run all tests
yarn test

# Watch mode (auto-rerun on changes)
yarn test:watch

# Coverage report
yarn test:cov
```

Tests cover:
- ✅ Get all contacts (cached & uncached)
- ✅ Create contact (success, duplicate, invalid address)
- ✅ Update contact (success, not found)
- ✅ Delete contact (success, not found)

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Change port in .env
HTTP_CONTACTS_PORT=5006
```

### Database connection failed
```bash
# Verify PostgreSQL is running
psql -h localhost -U postgres -d paypay_contacts

# Or create database
createdb paypay_contacts
```

### Redis connection failed
```bash
# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

---

## 📊 Check Database

```bash
# Open Prisma Studio (visual DB browser)
npx prisma studio

# Or use psql
psql postgresql://postgres:postgres@localhost:5432/paypay_contacts
SELECT * FROM contacts;
```

---

## 🔄 Reset Everything

```bash
# Clean build + reinstall + rebuild
yarn reset

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## Next Steps

1. ✅ Service created
2. ⏭️ Add to docker-compose.yml (if using Docker)
3. ⏭️ Update API gateway routes
4. ⏭️ Update frontend to use real API (uncomment in contacts.api.ts)

