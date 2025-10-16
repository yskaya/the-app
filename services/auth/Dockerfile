FROM node:20

WORKDIR /app

# Copy workspace files
COPY ../../package.json ../../yarn.lock ./
COPY ../../packages ./packages
COPY ../../services ./services

# Install all dependencies in the monorepo
RUN yarn install --frozen-lockfile

# Copy service-specific code
COPY . .

# Build the app
RUN yarn workspace auth build

CMD ["yarn", "workspace", "auth", "start"]