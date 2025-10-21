# 🔗 Frontend Integration Guide

## How to Switch from Mock to Real API

Currently your frontend uses `mockedAPI/contacts.mock.ts`. Here's how to connect it to the real backend:

### Step 1: Update `contacts.api.ts`

**File**: `frontend/src/features/contacts/contacts.api.ts`

```typescript
// BEFORE (using mock):
export const getContacts = async (): Promise<Contact[]> => {
  // TODO: Replace mock with real API
  // const response = await api.get<Contact[]>('/contacts');
  // return response.data;
  
  const data = await getMockContacts();  // ← REMOVE
  return data;                            // ← REMOVE
};

// AFTER (using real API):
export const getContacts = async (): Promise<Contact[]> => {
  const response = await api.get<Contact[]>('/contacts');
  return response.data;
};
```

Do the same for all 4 functions:
- `getContacts()`
- `createContact()`
- `updateContact()`
- `deleteContact()`

### Step 2: Remove Mock Imports

```typescript
// Delete this import
import { 
  getMockContacts, 
  createMockContact, 
  updateMockContact, 
  deleteMockContact 
} from '@/mockedAPI';
```

### Step 3: Update API Base URL

**File**: `frontend/.env.local`

```env
# Option A: Direct to Contacts Service (dev)
NEXT_PUBLIC_API_URL=http://localhost:5005/api

# Option B: Through API Gateway (recommended)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 4: Verify Frontend API Client

**File**: `frontend/src/lib/api.client.ts`

Make sure it uses the env variable:
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});
```

---

## 🔐 Authentication Flow

The backend expects `x-user-id` header. Make sure your API client adds it:

**File**: `frontend/src/lib/api.client.ts`

```typescript
api.interceptors.request.use((config) => {
  // Add user ID from auth context (or session)
  const userId = getCurrentUserId(); // Implement this
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});
```

---

## ✅ Testing the Integration

### 1. Start Backend
```bash
cd backend/services/contacts
yarn start:dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Open Dashboard
```
http://localhost:3000/dashboard
```

### 4. Click "Contacts" Button
You should see 7 contacts from the database!

---

## 🐛 Debugging

### Check if service is running:
```bash
curl http://localhost:5005/api/contacts -H "x-user-id: user-1"
```

### Check database:
```bash
npx prisma studio
# Opens visual DB browser
```

### Check Redis cache:
```bash
redis-cli
GET contacts:user:user-1
```

### Check logs:
Backend console will show:
```
!!!!! Contacts.getAll. userId= user-1
```

---

## 🔄 Data Sync

When you create/update/delete in frontend:

```
Frontend Action (Create Contact) →
  ├─ Optimistic Update (instant UI via ContactsProvider)
  ├─ API Call (POST /api/contacts)
  ├─ Backend saves to PostgreSQL
  ├─ Backend invalidates Redis cache
  ├─ Backend returns new contact
  ├─ Frontend replaces optimistic with real data
  └─ React Query invalidates cache
```

Perfect optimistic UX! ⚡

---

## 📊 Expected API Responses

### GET /api/contacts
```json
[
  {
    "id": "1",
    "userId": "user-1",
    "name": "Main Exchange",
    "address": "0x8f3d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f",
    "note": "Primary trading account",
    "createdAt": "2025-10-20T10:00:00.000Z",
    "updatedAt": "2025-10-20T10:00:00.000Z"
  },
  // ... 6 more
]
```

### POST /api/contacts
```json
{
  "id": "abc-123-def",
  "userId": "user-1",
  "name": "New Contact",
  "address": "0x1234567890123456789012345678901234567890",
  "note": "Test",
  "createdAt": "2025-10-20T15:30:00.000Z",
  "updatedAt": "2025-10-20T15:30:00.000Z"
}
```

---

## 🎯 Quick Switch Checklist

1. [ ] Backend service running on :5005
2. [ ] Database migrated & seeded
3. [ ] Frontend `contacts.api.ts` updated (4 functions)
4. [ ] Mock imports removed
5. [ ] `.env.local` has correct API URL
6. [ ] API client adds `x-user-id` header
7. [ ] Test in browser - see 7 contacts!

**Total time: ~5 minutes** ⏱️

