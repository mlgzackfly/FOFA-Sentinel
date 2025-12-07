# Multi-stage build for FOFA Sentinel

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY src/client ./src/client
COPY src/shared ./src/shared
COPY index.html ./
COPY public ./public

# Build frontend
RUN npm run build:client

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy backend source
COPY src/server ./src/server
COPY src/shared ./src/shared

# Build backend (TypeScript compilation only)
RUN npx tsc -p tsconfig.server.json

# Stage 3: Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy built backend from builder
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from builder
COPY --from=frontend-builder /app/dist/client ./dist/client

# Copy source files needed for runtime (since we're using tsx to run TypeScript directly)
COPY --from=backend-builder /app/src/server ./src/server
COPY --from=backend-builder /app/src/shared ./src/shared
COPY --from=backend-builder /app/tsconfig.server.json ./tsconfig.server.json

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3002

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["tsx", "src/server/index.ts"]

