FROM node:20

WORKDIR /app

# Copy the entire monorepo (packages, services, everything)
COPY . .

# Install dependencies for the whole workspace
RUN yarn install --frozen-lockfile

# Build inside the workspace (Now should work correctly)
RUN yarn workspace @paypay/grpc-clients build

CMD ["yarn", "workspace", "@paypay/grpc-clients", "build"]