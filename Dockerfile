# Multi-stage build for South Delhi Real Estate webapp
FROM node:20-alpine AS base

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install instead of npm ci for better compatibility)
RUN npm install --only=production && npm cache clean --force

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install all dependencies including dev dependencies
RUN npm install

# Copy source code
COPY . .

# Expose development ports
EXPOSE 5000 5173

# Start development server
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
ENV NODE_ENV=production

# Install all dependencies including dev dependencies for build
RUN npm install

# Copy source code
COPY . .

# Build the application (simplified build process)
RUN npm run build:server

# Production stage
FROM node:20-alpine AS production
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S webapp -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=webapp:nodejs /app/dist ./dist
COPY --from=builder --chown=webapp:nodejs /app/package.json ./package.json
COPY --from=builder --chown=webapp:nodejs /app/node_modules ./node_modules

# Copy necessary configuration files
COPY --from=builder --chown=webapp:nodejs /app/shared ./shared
COPY --from=builder --chown=webapp:nodejs /app/migrations ./migrations

# Create required directories
RUN mkdir -p uploads logs && chown -R webapp:nodejs uploads logs

# Switch to non-root user
USER webapp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/index.js"]
