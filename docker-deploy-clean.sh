#!/bin/bash

# South Delhi Real Estate - Clean Docker Deployment Script
# This script builds and starts only the application container
# Database credentials are read from .env file

set -e

echo "🚀 Starting South Delhi Real Estate Application Deployment"
echo "========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with your database credentials."
    exit 1
fi

echo "✅ Environment file found: .env"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down --remove-orphans 2>/dev/null || true

# Build and start the application
echo "🏗️  Building and starting application..."
docker compose up --build -d

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 45

# Check service status
echo "🔍 Checking application status..."
docker compose ps

# Test application health
echo "🏥 Testing application health..."
sleep 15
if curl -f http://localhost:7822/health >/dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "⚠️  Application may still be starting up. Check logs below:"
fi

# Show recent logs
echo "📋 Showing recent logs..."
docker compose logs --tail=30

echo ""
echo "✅ Deployment completed!"
echo "🌐 Application URL: http://localhost:7822"
echo ""
echo "📊 To view logs: docker compose logs -f"
echo "🛑 To stop: docker compose down"
echo "🔄 To restart: docker compose restart"
echo ""
echo "Database Configuration:"
echo "- Using external database from .env file"
echo "- No local MySQL container running"
echo "- All settings loaded from environment variables"
