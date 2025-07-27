#!/bin/bash

# Health Check Script for South Delhi Realty Application
# This script checks the health and status of the deployed application

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== South Delhi Realty Health Check ===${NC}"
echo -e "Checking application status...\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Docker is running${NC}"
fi

# Check if container exists and is running
if docker ps | grep -q "southdelhirealty-app"; then
    echo -e "${GREEN}✓ Container is running${NC}"
    
    # Get container status
    CONTAINER_STATUS=$(docker inspect southdelhirealty-app --format='{{.State.Status}}')
    echo -e "Container Status: ${GREEN}$CONTAINER_STATUS${NC}"
    
    # Get container uptime
    UPTIME=$(docker inspect southdelhirealty-app --format='{{.State.StartedAt}}')
    echo -e "Started At: ${GREEN}$UPTIME${NC}"
    
else
    echo -e "${RED}✗ Container is not running${NC}"
    echo -e "${YELLOW}Attempting to check if container exists...${NC}"
    
    if docker ps -a | grep -q "southdelhirealty-app"; then
        echo -e "${YELLOW}⚠ Container exists but is stopped${NC}"
        echo -e "Container logs (last 10 lines):"
        docker logs southdelhirealty-app --tail 10
    else
        echo -e "${RED}✗ Container does not exist${NC}"
        echo -e "Run deployment script: ./deploy-vps.sh"
    fi
    exit 1
fi

# Check application endpoint
echo -e "\n${BLUE}Testing Application Endpoints:${NC}"

# Test main endpoint
if curl -s -f http://localhost:7822 > /dev/null; then
    echo -e "${GREEN}✓ Main endpoint (/) is responding${NC}"
else
    echo -e "${RED}✗ Main endpoint (/) is not responding${NC}"
fi

# Test health endpoint (if it exists)
if curl -s -f http://localhost:7822/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health endpoint (/health) is responding${NC}"
else
    echo -e "${YELLOW}⚠ Health endpoint (/health) not available or not responding${NC}"
fi

# Test API endpoint
if curl -s -f http://localhost:7822/api/properties > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API endpoint (/api/properties) is responding${NC}"
else
    echo -e "${YELLOW}⚠ API endpoint (/api/properties) not responding (might require authentication)${NC}"
fi

# Check resource usage
echo -e "\n${BLUE}Resource Usage:${NC}"
docker stats southdelhirealty-app --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

# Check recent logs for errors
echo -e "\n${BLUE}Recent Log Analysis:${NC}"
ERROR_COUNT=$(docker logs southdelhirealty-app --since 1h 2>&1 | grep -i "error" | wc -l)
WARNING_COUNT=$(docker logs southdelhirealty-app --since 1h 2>&1 | grep -i "warning\|warn" | wc -l)

echo -e "Errors in last hour: ${RED}$ERROR_COUNT${NC}"
echo -e "Warnings in last hour: ${YELLOW}$WARNING_COUNT${NC}"

if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "\n${RED}Recent Errors:${NC}"
    docker logs southdelhirealty-app --since 1h 2>&1 | grep -i "error" | tail -5
fi

# Check disk space
echo -e "\n${BLUE}Disk Usage:${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo -e "${RED}⚠ Disk usage is high: $DISK_USAGE%${NC}"
elif [ $DISK_USAGE -gt 80 ]; then
    echo -e "${YELLOW}⚠ Disk usage: $DISK_USAGE%${NC}"
else
    echo -e "${GREEN}✓ Disk usage: $DISK_USAGE%${NC}"
fi

# Check Docker volumes
echo -e "\n${BLUE}Docker Volumes:${NC}"
docker volume ls | grep southdelhirealty || echo -e "${YELLOW}No application volumes found${NC}"

# Summary
echo -e "\n${BLUE}=== Health Check Summary ===${NC}"
if docker ps | grep -q "southdelhirealty-app" && curl -s -f http://localhost:7822 > /dev/null; then
    echo -e "${GREEN}✅ Application is healthy and running normally${NC}"
    echo -e "Access your application at: ${GREEN}http://your-vps-ip:7822${NC}"
else
    echo -e "${RED}❌ Application has issues that need attention${NC}"
    echo -e "Check the logs: ${YELLOW}docker logs southdelhirealty-app -f${NC}"
fi

# Provide useful commands
echo -e "\n${BLUE}Useful Commands:${NC}"
echo -e "View live logs: ${YELLOW}docker logs southdelhirealty-app -f${NC}"
echo -e "Restart app: ${YELLOW}docker-compose -f docker-compose.production.yml restart${NC}"
echo -e "Stop app: ${YELLOW}docker-compose -f docker-compose.production.yml down${NC}"
echo -e "Redeploy: ${YELLOW}./deploy-vps.sh${NC}"
