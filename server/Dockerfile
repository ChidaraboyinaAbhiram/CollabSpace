# Multi-stage Dockerfile for CollabSpace Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies and generate Prisma Client
RUN npm ci
RUN npx prisma generate

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules with generated Prisma client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
COPY src ./src

# Expose API and WebSocket port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
