# South Delhi Real Estate - Production Dockerfile
FROM node:22-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    mysql-client \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (client + server)
RUN npm run build

# Remove dev dependencies after build
RUN npm ci --omit=dev && npm cache clean --force

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs && \
    chmod 755 /app/uploads /app/logs

# Expose port
EXPOSE 7822

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7822/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application directly
CMD ["npm", "start"] 