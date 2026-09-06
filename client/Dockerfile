# Multi-stage Dockerfile for CollabSpace Client
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and build production assets
COPY . ./
RUN npm run build

# Nginx production serving stage
FROM nginx:alpine AS runner

# Copy built static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
