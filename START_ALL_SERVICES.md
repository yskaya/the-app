# 🚀 Starting All Backend Services

## ✅ **Quick Start - All Services Together**

You can now start ALL backend services with a single command!

```bash
cd /Users/ykanapatskaya/Workspace/paypay/backend
yarn dev
```

This will start all 6 microservices simultaneously with colored output:
- 🔵 **API Gateway** (port 5555) - blue
- 🟢 **Auth Service** (port 5001) - green  
- 🟡 **Users Service** (port 5002) - yellow
- 🟣 **Tokens Service** (port 5003) - magenta
- 🔵 **Contacts Service** (port 5004) - cyan
- ⚪ **Wallet Service** (port 5006) - white

## 📋 **Available Commands**

### **Start All Services (Development)**
```bash
yarn dev
```
Starts all 6 services with hot-reload and colored logs.

### **Start Core Services Only**
```bash
yarn dev:core
```
Starts only the essential services (gateway, auth, users) - useful for basic testing.

### **Start Individual Services**
```bash
yarn start:gateway   # API Gateway
yarn start:auth      # Auth Service
yarn start:users     # Users Service
yarn start:tokens    # Tokens Service
yarn start:contacts  # Contacts Service
yarn start:wallet    # Wallet Service
```

### **Build All Services**
```bash
yarn build
```

### **Generate Prisma Clients**
```bash
yarn prisma:generate
```
Generates Prisma clients for users, contacts, and wallet services.

### **Run Database Migrations**
```bash
yarn prisma:migrate
```
Runs migrations for all services with databases.

## 🔧 **Prerequisites**

Before starting services, make sure:

### **1. Databases Are Running**
```bash
# PostgreSQL
brew services start postgresql

# Redis
brew services start redis

# Verify
redis-cli ping        # Should return: PONG
psql -l              # Should list databases
```

### **2. Environment Variables Are Set**

Each service needs its `.env` file. Create from examples:

```bash
# Auth Service
cd services/auth
cp .env.example .env
# Edit .env with your values

# Users Service
cd ../users
cp .env.example .env

# Wallet Service
cd ../wallet
cp env.example .env
# Edit .env with Sepolia RPC URL and encryption key

# Repeat for other services...
```

### **3. Dependencies Are Installed**
```bash
cd /Users/ykanapatskaya/Workspace/paypay/backend
yarn install
```

### **4. Prisma Clients Are Generated**
```bash
yarn prisma:generate
```

## 📊 **Service Ports**

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 5555 | Main entry point, routes to other services |
| Auth | 5001 | Authentication (Google OAuth) |
| Users | 5002 | User management |
| Tokens | 5003 | JWT token management |
| Contacts | 5005 | Contact management |
| Wallet | 5006 | Crypto wallet (Sepolia testnet) |

## 🔍 **Verify Services Are Running**

After starting, check health endpoints:

```bash
# API Gateway
curl http://localhost:5555/health

# Auth Service
curl http://localhost:5001/health

# Users Service
curl http://localhost:5002/health

# All services
curl http://localhost:5555/health && \
curl http://localhost:5001/health && \
curl http://localhost:5002/health && \
curl http://localhost:5003/health && \
curl http://localhost:5005/health && \
curl http://localhost:5006/health
```

## 🐛 **Troubleshooting**

### **Problem: Services won't start**
```bash
# Clean everything and rebuild
yarn reset
```

### **Problem: Port already in use**
```bash
# Find what's using the port
lsof -ti:5555  # Replace with your port

# Kill the process
kill -9 $(lsof -ti:5555)
```

### **Problem: TypeScript errors**
✅ Already fixed! All services have updated `tsconfig.json` with:
- `"types": ["node", "jest"]`
- `"skipLibCheck": true`

### **Problem: Database connection errors**
```bash
# Make sure PostgreSQL and Redis are running
brew services list

# Start them if needed
brew services start postgresql
brew services start redis
```

### **Problem: Prisma client not found**
```bash
yarn prisma:generate
```

## 🎯 **Development Workflow**

1. **First Time Setup:**
```bash
cd /Users/ykanapatskaya/Workspace/paypay/backend
yarn install
yarn prisma:generate
yarn build
```

2. **Daily Development:**
```bash
# Start databases
brew services start postgresql redis

# Start all services
yarn dev

# Services auto-reload on file changes!
```

3. **Testing:**
```bash
# Run tests for all services
yarn workspaces run test

# Run tests for specific service
cd services/wallet
npm test
```

## 📝 **Logs**

All services log with colored output:
- **Blue** = API Gateway
- **Green** = Auth
- **Yellow** = Users
- **Magenta** = Tokens
- **Cyan** = Contacts
- **White** = Wallet

Each log line is prefixed with the service name for easy identification.

## 🎉 **You're Ready!**

Now you can:
- ✅ Start all services with `yarn dev`
- ✅ Sign in with Google OAuth works
- ✅ Frontend can connect to backend
- ✅ Test crypto transactions on Sepolia
- ✅ Full microservices architecture running locally

Happy coding! 🚀
