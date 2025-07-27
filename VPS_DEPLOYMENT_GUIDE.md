# VPS Docker Deployment Guide for South Delhi Realty

## Overview
This guide provides complete instructions for deploying the South Delhi Realty application to a VPS server using Docker containers with an external MySQL database.

## Prerequisites

### VPS Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 7+
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Public IP address with port 7822 accessible

### Software Requirements
- Docker Engine 20.10+
- Docker Compose v2.0+
- curl (for health checks)

## Pre-Deployment Setup

### 1. Prepare Your VPS Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### 2. Firewall Configuration

```bash
# Allow SSH (if using UFW)
sudo ufw allow ssh

# Allow application port
sudo ufw allow 7822/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 3. Upload Application Files

Upload these files to your VPS server:
- All application source code
- `.env` file with your database credentials
- `Dockerfile.production`
- `docker-compose.production.yml`
- `deploy-vps.sh`

## Environment Configuration

### 1. Create/Update .env File

```bash
# Database Configuration (External MySQL)
DB_HOST=your-mysql-host.com
DB_PORT=3306
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=your-database-name

# Application Configuration
NODE_ENV=production
PORT=7822
JWT_SECRET=your-very-secure-jwt-secret-here
SESSION_SECRET=your-very-secure-session-secret-here

# Email Configuration (if using email features)
EMAIL_HOST=your-smtp-host.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password

# Cloudinary Configuration (if using image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth (if using Google authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Database Setup

Ensure your external MySQL database:
- Is accessible from your VPS IP
- Has the correct database created
- User has necessary permissions
- All required tables are migrated

## Deployment Process

### 1. Quick Deployment (Recommended)

```bash
# Make deployment script executable
chmod +x deploy-vps.sh

# Run deployment
./deploy-vps.sh
```

### 2. Manual Deployment Steps

```bash
# 1. Clean up existing containers
docker-compose -f docker-compose.production.yml down --remove-orphans
docker container prune -f

# 2. Build production image
docker build -f Dockerfile.production -t southdelhirealty:latest .

# 3. Start the application
docker-compose -f docker-compose.production.yml up -d

# 4. Check status
docker ps
docker logs southdelhirealty-app -f
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check container status
docker ps | grep southdelhirealty

# Check application logs
docker logs southdelhirealty-app -f

# Test application endpoint
curl http://localhost:7822
curl http://your-vps-ip:7822
```

### 2. Database Connection Test

```bash
# Check database connectivity from container
docker exec southdelhirealty-app node -e "
const mysql = require('mysql2/promise');
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
connection.connect().then(() => console.log('Database connected!')).catch(console.error);
"
```

## Container Management

### Common Commands

```bash
# View logs
docker logs southdelhirealty-app -f

# Restart application
docker-compose -f docker-compose.production.yml restart

# Stop application
docker-compose -f docker-compose.production.yml down

# View container statistics
docker stats southdelhirealty-app

# Execute commands inside container
docker exec -it southdelhirealty-app bash

# Update application (redeploy)
./deploy-vps.sh
```

### Backup and Maintenance

```bash
# Backup application data (uploads, logs)
docker run --rm -v southdelhirealty_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data

# View disk usage
docker system df

# Clean up unused images
docker image prune -a

# Clean up unused volumes
docker volume prune
```

## Monitoring and Troubleshooting

### Application Monitoring

```bash
# Real-time logs
docker logs southdelhirealty-app -f

# Container resource usage
docker stats southdelhirealty-app

# Container health status
docker inspect southdelhirealty-app | grep -A 5 "Health"
```

### Common Issues and Solutions

#### 1. Container Won't Start
```bash
# Check logs for errors
docker logs southdelhirealty-app

# Common issues:
# - Database connection errors: Check .env credentials
# - Port conflicts: Ensure port 7822 is available
# - Memory issues: Check available RAM
```

#### 2. Database Connection Failed
```bash
# Test database connectivity
docker exec southdelhirealty-app npm run test:db

# Check database server status
# Verify firewall allows connection from VPS IP
# Confirm credentials in .env file
```

#### 3. High Memory Usage
```bash
# Monitor memory usage
docker stats southdelhirealty-app

# Restart container if needed
docker-compose -f docker-compose.production.yml restart
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` file to version control
- Use strong, unique passwords
- Rotate secrets regularly

### 2. Container Security
- Application runs as non-root user
- Read-only filesystem where possible
- Resource limits enforced
- Security options enabled

### 3. Network Security
- Use HTTPS in production (configure reverse proxy)
- Restrict database access to VPS IP only
- Keep Docker and system packages updated

## SSL/HTTPS Setup (Optional)

For production deployment, consider setting up SSL:

```bash
# Install Nginx
sudo apt install nginx

# Configure reverse proxy with SSL
# Use Let's Encrypt for free SSL certificates
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Performance Optimization

### 1. Resource Limits
The production configuration includes:
- Memory limit: 1GB
- CPU limit: 0.8 cores
- Memory reservation: 512MB

### 2. Database Optimization
- Use connection pooling
- Optimize database queries
- Regular database maintenance

### 3. Application Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies

## Support and Maintenance

### Regular Maintenance Tasks
1. Monitor application logs
2. Check database performance
3. Update Docker images
4. Backup critical data
5. Monitor resource usage

### Getting Help
- Check application logs: `docker logs southdelhirealty-app -f`
- Review database connections
- Verify environment variables
- Check system resources

---

## Quick Reference

**Start Application**: `./deploy-vps.sh`
**View Logs**: `docker logs southdelhirealty-app -f`
**Stop Application**: `docker-compose -f docker-compose.production.yml down`
**Restart**: `docker-compose -f docker-compose.production.yml restart`
**Application URL**: `http://your-vps-ip:7822`
