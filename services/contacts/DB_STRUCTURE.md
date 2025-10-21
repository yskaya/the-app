# Contacts Service - Database Structure

## 📊 Database Schema

```sql
CREATE TABLE "contacts" (
    "id" TEXT PRIMARY KEY,              -- UUID
    "userId" TEXT NOT NULL,             -- Foreign key to User
    "name" TEXT NOT NULL,               -- Contact name
    "address" TEXT NOT NULL,            -- Wallet address (0x...)
    "note" TEXT,                        -- Optional note
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX "contacts_userId_idx" ON "contacts"("userId");
CREATE INDEX "contacts_address_idx" ON "contacts"("address");

-- Unique constraint: User cannot have duplicate addresses
CREATE UNIQUE INDEX "contacts_userId_address_key" ON "contacts"("userId", "address");
```

## 🔑 Key Constraints

| Constraint | Purpose |
|------------|---------|
| `PRIMARY KEY (id)` | Unique identifier |
| `INDEX (userId)` | Fast lookup of user's contacts |
| `INDEX (address)` | Fast address searches |
| `UNIQUE (userId, address)` | Prevent duplicate addresses per user |

## 📝 Seed Data (7 Contacts)

When you run `yarn prisma:seed`, it creates:

| ID | Name | Address | Note |
|----|------|---------|------|
| 1 | Main Exchange | 0x8f3d...0e1f | Primary trading account |
| 2 | Backup Exchange | 0x1a2b...9a0b | - |
| 3 | Hardware Wallet | 0x7b2c...9b0c | Cold storage |
| 4 | Alice | 0x9e4f...1e2f | - |
| 5 | Bob | 0x2f7a...4f5a | - |
| 6 | Company Treasury | 0x5c6d...3c4d | - |
| 7 | Quick Wallet | 0x3d4e...1d2e | - |

All contacts are created for `userId = "user-1"` (your current profile).

## 🔒 Security Features

1. **User Isolation**: Queries filtered by `userId` from headers
2. **Ownership Verification**: Users can only access their own contacts
3. **Duplicate Prevention**: Unique constraint on `userId + address`
4. **Address Validation**: Must start with `0x` and be 42 characters

## 💾 Caching Strategy

```
Redis Key: contacts:user:{userId}
TTL: 5 minutes (300 seconds)

Invalidated on:
  - Create contact
  - Update contact
  - Delete contact
```

## 📈 Performance

- **Read** (cached): ~1ms
- **Read** (uncached): ~50ms
- **Write**: ~100ms + cache invalidation

## 🔄 Data Flow

```
GET /api/contacts
  ↓
Check Redis cache (contacts:user:{userId})
  ↓
If cached → Return
  ↓
If not cached → Query PostgreSQL → Cache → Return
```

```
POST /api/contacts
  ↓
Validate address format
  ↓
Create in PostgreSQL
  ↓
Invalidate Redis cache
  ↓
Return new contact
```

## 🧪 Testing

Run tests:
```bash
yarn test
```

Coverage includes:
- ✅ getAllContacts (cached & uncached)
- ✅ createContact (success & validation errors)
- ✅ updateContact (success & not found)
- ✅ deleteContact (success & not found)
- ✅ Duplicate address handling
- ✅ Invalid address format

## 📦 Example Usage

### Create Contact
```bash
curl -X POST http://localhost:5005/api/contacts \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{
    "name": "New Contact",
    "address": "0x1234567890123456789012345678901234567890",
    "note": "Test note"
  }'
```

### Get All Contacts
```bash
curl http://localhost:5005/api/contacts \
  -H "x-user-id: user-1"
```

### Update Contact
```bash
curl -X PATCH http://localhost:5005/api/contacts/1 \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{
    "name": "Updated Name",
    "note": "Updated note"
  }'
```

### Delete Contact
```bash
curl -X DELETE http://localhost:5005/api/contacts/1 \
  -H "x-user-id: user-1"
```

