FROM node:20-alpine

WORKDIR /app

# Copy workspace dependencies
COPY package.json yarn.lock ./
COPY packages ./packages

# Copy service files
COPY services/contacts ./services/contacts

# Install dependencies
RUN yarn install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/services/contacts
RUN npx prisma generate

# Build service
RUN yarn build

EXPOSE 5005

CMD ["yarn", "start"]

