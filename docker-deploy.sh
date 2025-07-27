#!/bin/bash

# South Delhi Real Estate - Docker Deployment Script
# This script builds and starts the complete application stack

set -e

echo "🚀 Starting South Delhi Real Estate Docker Deployment"
echo "=================================================="

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down --remove-orphans

# Remove old images (optional - uncomment if you want to force rebuild)
# echo "🗑️  Removing old images..."
# docker compose down --rmi all

# Build and start the services
echo "🏗️  Building and starting services..."
docker compose up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker compose ps

# Show logs for debugging
echo "📋 Showing recent logs..."
docker compose logs --tail=50

echo ""
echo "✅ Deployment completed!"
echo "🌐 Application URL: http://localhost:7822"
echo "🗄️  Database Admin (phpMyAdmin): http://localhost:8080"
echo ""
echo "📊 To view logs: docker compose logs -f"
echo "🛑 To stop: docker compose down"
echo "🔄 To restart: docker compose restart"
echo ""
echo "Database credentials for phpMyAdmin:"
echo "Username: root"
echo "Password: root_secure_password_456"
