# Contacts Service

Microservice for managing user wallet contacts (address book).

## Features

- ✅ CRUD operations for contacts
- ✅ User isolation (contacts scoped to userId)
- ✅ Redis caching (5 min TTL)
- ✅ Duplicate address prevention
- ✅ Wallet address validation
- ✅ Rate limiting (300 req/15min)

## Database Schema

```prisma
model Contact {
  id        String   @id @default(uuid())
  userId    String   
  name      String
  address   String   // Wallet address (0x...)
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([address])
  @@unique([userId, address])
}
```

### Constraints:
- **Unique**: User cannot have duplicate wallet addresses
- **Indexed**: Fast lookups by userId and address
- **Isolated**: Users only see their own contacts

## API Endpoints

### GET /api/contacts
Get all contacts for authenticated user

**Headers**: `x-user-id: string`

**Response**:
```json
[
  {
    "id": "uuid",
    "userId": "user-1",
    "name": "Alice",
    "address": "0x123...",
    "note": "Friend",
    "createdAt": "2025-10-20T10:00:00Z",
    "updatedAt": "2025-10-20T10:00:00Z"
  }
]
```

### POST /api/contacts
Create new contact

**Headers**: `x-user-id: string`

**Body**:
```json
{
  "name": "Bob",
  "address": "0x456...",
  "note": "Business partner"
}
```

**Response**: Created contact object

**Errors**:
- `400`: Invalid wallet address format
- `409`: Duplicate address for this user

### PATCH /api/contacts/:id
Update contact

**Headers**: `x-user-id: string`

**Body**:
```json
{
  "name": "Bob Updated",
  "note": "New note"
}
```

**Response**: Updated contact object

**Errors**:
- `404`: Contact not found or not owned by user

### DELETE /api/contacts/:id
Delete contact

**Headers**: `x-user-id: string`

**Response**:
```json
{
  "message": "Contact deleted successfully"
}
```

**Errors**:
- `404`: Contact not found or not owned by user

## Setup

### 1. Install Dependencies
```bash
cd backend/services/contacts
yarn install
```

### 2. Database Setup
```bash
# Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/contacts?schema=public"

# Run migrations
yarn prisma:migrate

# Seed with test data
yarn prisma:seed
```

### 3. Run Service
```bash
# Development
yarn start:dev

# Production
yarn build
yarn start
```

Service runs on: `http://localhost:5005`

## Testing

```bash
# Run tests
yarn test

# Watch mode
yarn test:watch

# Coverage
yarn test:cov
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HTTP_CONTACTS_PORT` | `5005` | REST API port |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |

## Cache Strategy

- **Key format**: `contacts:user:{userId}`
- **TTL**: 5 minutes (300s)
- **Invalidation**: On create/update/delete

## Development Notes

- Contacts are scoped by `userId` from header
- Address format validated: must start with `0x` and be 42 chars
- Duplicate addresses prevented per user (unique constraint)
- All errors return proper HTTP status codes
- Redis cache for performance

## Integration with API Gateway

Add to gateway routes:
```typescript
{
  path: '/contacts',
  target: 'http://localhost:5005/api/contacts',
  method: 'ALL'
}
```

