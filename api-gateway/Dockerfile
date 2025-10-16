# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY ../package.json ../yarn.lock ./
COPY ../packages ./packages
COPY ../services ./services

RUN yarn install --frozen-lockfile

# Copy the rest of the files
COPY . .

RUN yarn workspace api-gateway build

# Expose service port
EXPOSE 5555

# Start the service
CMD ["yarn", "workspace", "api-gateway", "start"]
