FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 5006

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

