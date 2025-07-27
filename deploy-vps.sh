#!/bin/bash

# VPS Docker Deployment Script for South Delhi Realty
# This script deploys the application to a VPS server using Docker

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== South Delhi Realty VPS Deployment ===${NC}"
echo -e "Starting deployment process..."

# Check if required files exist
echo -e "\n${YELLOW}Checking required files...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file with your database credentials"
    exit 1
fi

if [ ! -f "Dockerfile.production" ]; then
    echo -e "${RED}Error: Dockerfile.production not found!${NC}"
    exit 1
fi

if [ ! -f "docker-compose.production.yml" ]; then
    echo -e "${RED}Error: docker-compose.production.yml not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required files found${NC}"

# Clean up any existing containers and images
echo -e "\n${YELLOW}Cleaning up existing containers...${NC}"
docker-compose -f docker-compose.production.yml down --remove-orphans || true
docker container prune -f || true

# Remove old images (optional - comment out if you want to keep them)
echo -e "${YELLOW}Removing old images...${NC}"
docker image rm southdelhirealty:latest || true
docker image prune -f || true

# Build the production image
echo -e "\n${YELLOW}Building production Docker image...${NC}"
docker build -f Dockerfile.production -t southdelhirealty:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Docker image build failed${NC}"
    exit 1
fi

# Start the application
echo -e "\n${YELLOW}Starting the application...${NC}"
docker-compose -f docker-compose.production.yml up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Application started successfully${NC}"
else
    echo -e "${RED}✗ Failed to start application${NC}"
    exit 1
fi

# Wait for health check
echo -e "\n${YELLOW}Waiting for application to be healthy...${NC}"
sleep 10

# Check if container is running
if docker ps | grep -q "southdelhirealty-app"; then
    echo -e "${GREEN}✓ Container is running${NC}"
else
    echo -e "${RED}✗ Container is not running${NC}"
    echo "Container logs:"
    docker logs southdelhirealty-app
    exit 1
fi

# Display deployment status
echo -e "\n${BLUE}=== Deployment Status ===${NC}"
echo -e "Container Status:"
docker ps | grep southdelhirealty

echo -e "\n${BLUE}=== Application Health Check ===${NC}"
sleep 5
if curl -f http://localhost:7822/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is healthy and responding${NC}"
else
    echo -e "${YELLOW}⚠ Health check endpoint not responding (this might be normal if health endpoint doesn't exist)${NC}"
fi

echo -e "\n${BLUE}=== Deployment Information ===${NC}"
echo -e "Application URL: ${GREEN}http://your-vps-ip:7822${NC}"
echo -e "Container Name: ${GREEN}southdelhirealty-app${NC}"
echo -e "Network Port: ${GREEN}7822${NC}"

echo -e "\n${BLUE}=== Useful Commands ===${NC}"
echo -e "View logs: ${YELLOW}docker logs southdelhirealty-app -f${NC}"
echo -e "Stop application: ${YELLOW}docker-compose -f docker-compose.production.yml down${NC}"
echo -e "Restart application: ${YELLOW}docker-compose -f docker-compose.production.yml restart${NC}"
echo -e "View container stats: ${YELLOW}docker stats southdelhirealty-app${NC}"

echo -e "\n${GREEN}🚀 Deployment completed successfully!${NC}"
echo -e "Your South Delhi Realty application is now running on port 7822"
