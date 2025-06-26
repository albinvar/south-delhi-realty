# South Delhi Real Estate - Docker Commands

This document contains all the necessary Docker commands to run your South Delhi Real Estate application.

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured with your settings

## Quick Start

### 1. Build and Start the Application

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up --build -d
```

### 2. View Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs app
docker-compose logs mysql

# Follow logs in real-time
docker-compose logs -f app
```

### 3. Stop the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete database data)
docker-compose down -v
```

## Development Commands

### Rebuild Application Only

```bash
# Rebuild just the app service
docker-compose build app
docker-compose up app
```

### Access Application Container

```bash
# Open bash shell in running container
docker-compose exec app bash

# Run commands in container
docker-compose exec app npm run migrate
docker-compose exec app node -e "console.log('Hello from container')"
```

### Access MySQL Database

```bash
# Connect to MySQL
docker-compose exec mysql mysql -u southdel_main -p southdel_main

# Import SQL file
docker-compose exec -T mysql mysql -u southdel_main -p southdel_main < your-file.sql
```

## Maintenance Commands

### View Container Status

```bash
# See running containers
docker-compose ps

# See container resource usage
docker stats
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove everything (⚠️ Be careful)
docker system prune -a
```

### Backup Database

```bash
# Create database backup
docker-compose exec mysql mysqldump -u southdel_main -p southdel_main > backup.sql

# Restore from backup
docker-compose exec -T mysql mysql -u southdel_main -p southdel_main < backup.sql
```

## Environment Variables

The application uses the `.env` file for configuration. Key variables:

- `DB_HOST=mysql` (Docker service name)
- `NODE_ENV=production`
- `PORT=7822`
- All your existing email, OAuth, and Cloudinary settings

## URLs

When running with Docker:

- Application: http://localhost:7822
- MySQL: localhost:3306 (from host machine)

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Database Connection Issues

```bash
# Check if MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test database connection
docker-compose exec mysql mysqladmin ping -h localhost -u southdel_main -p
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :7822
# or
netstat -tulpn | grep 7822

# Kill the process or change port in docker-compose.yml
```

### Reset Everything

```bash
# Stop everything and remove volumes
docker-compose down -v

# Remove all related images
docker rmi $(docker images "*southdelhirealty*" -q)

# Start fresh
docker-compose up --build
```

## Production Deployment

For production deployment, consider:

1. Using a separate `.env.production` file
2. Setting up proper SSL certificates
3. Using a reverse proxy (Nginx)
4. Setting up proper backup strategies
5. Implementing monitoring and logging

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify your `.env` file settings
3. Ensure Docker has enough resources allocated
4. Check firewall settings for port 7822 