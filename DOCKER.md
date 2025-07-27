# South Delhi Real Estate - Docker Setup

This document provides instructions for running the South Delhi Real Estate application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+ (or docker-compose 1.29+)
- Git

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd SouthDelhiRealEstate
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.docker .env
   # Edit .env with your configuration
   ```

3. **Start the application**:
   ```bash
   # For production
   ./docker-run.sh prod

   # For development with hot reload
   ./docker-run.sh dev

   # For production with Nginx
   ./docker-run.sh nginx
   ```

## Available Commands

The `docker-run.sh` script provides the following commands:

- `./docker-run.sh build` - Build Docker images
- `./docker-run.sh prod` - Start production environment
- `./docker-run.sh dev` - Start development environment
- `./docker-run.sh nginx` - Start with Nginx reverse proxy
- `./docker-run.sh stop` - Stop all services
- `./docker-run.sh restart [mode]` - Restart services
- `./docker-run.sh logs [dev]` - View logs
- `./docker-run.sh status` - Show service status
- `./docker-run.sh clean` - Clean up Docker resources
- `./docker-run.sh migrate` - Run database migrations

## Environment Configuration

Copy `.env.docker` to `.env` and configure the following variables:

### Required Variables
- `SESSION_SECRET` - Secret key for session encryption
- `DB_PASSWORD` - Database password
- `DB_ROOT_PASSWORD` - MySQL root password

### Optional Variables
- `SMTP_*` - Email configuration for notifications
- `GOOGLE_CLIENT_*` - Google OAuth configuration
- `CLOUDINARY_*` - Cloudinary configuration for image uploads

## Services

The Docker setup includes the following services:

### Production (`docker-compose.yml`)
- **webapp** - Main application (Node.js/Express + React)
- **db** - MySQL 8.0 database
- **redis** - Redis for session storage (optional)
- **nginx** - Reverse proxy (optional, with `--profile nginx`)

### Development (`docker-compose.dev.yml`)
- **webapp-dev** - Development server with hot reload
- **db** - MySQL 8.0 database

## Port Mapping

### Production Mode
- Application: `http://localhost:5000`
- MySQL: `localhost:3306`
- Redis: `localhost:6379`

### Development Mode
- Backend API: `http://localhost:5000`
- Frontend Dev Server: `http://localhost:5173`
- MySQL: `localhost:3306`

### With Nginx
- Application: `http://localhost:80` (and `https://localhost:443` if SSL configured)

## Data Persistence

The following Docker volumes are created for data persistence:

- `mysql_data` - MySQL database files
- `redis_data` - Redis data
- `uploads_data` - Application file uploads
- `logs_data` - Application logs

## Development Workflow

1. **Start development environment**:
   ```bash
   ./docker-run.sh dev
   ```

2. **View logs**:
   ```bash
   ./docker-run.sh logs dev
   ```

3. **Access the application**:
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173

4. **Make changes** - The development container has hot reload enabled

5. **Run migrations** (if needed):
   ```bash
   ./docker-run.sh migrate
   ```

## Production Deployment

1. **Configure environment**:
   ```bash
   cp .env.docker .env
   # Edit .env with production values
   ```

2. **Build and start**:
   ```bash
   ./docker-run.sh build
   ./docker-run.sh prod
   ```

3. **With Nginx reverse proxy**:
   ```bash
   ./docker-run.sh nginx
   ```

## SSL Configuration (Nginx)

To enable SSL with Nginx:

1. Place your SSL certificates in `nginx/ssl/`:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key

2. Update `nginx/nginx.conf` with your domain configuration

3. Start with Nginx:
   ```bash
   ./docker-run.sh nginx
   ```

## Database Management

### Initial Setup
The database will be automatically initialized with:
- Database schema from `properties.sql`
- Migrations from `migrations/` directory

### Running Migrations
```bash
./docker-run.sh migrate
```

### Database Access
Connect to MySQL directly:
```bash
docker exec -it sdr-mysql mysql -u sduser -p southdelhirealestate
```

## Troubleshooting

### Check Service Status
```bash
./docker-run.sh status
```

### View Logs
```bash
# All services
./docker-run.sh logs

# Specific service
./docker-run.sh logs webapp

# Development
./docker-run.sh logs dev
```

### Clean Restart
```bash
./docker-run.sh stop
./docker-run.sh clean
./docker-run.sh build
./docker-run.sh prod
```

### Database Connection Issues
1. Ensure database is healthy:
   ```bash
   docker exec sdr-mysql mysqladmin ping -u root -p
   ```

2. Check database logs:
   ```bash
   docker logs sdr-mysql
   ```

### Memory Issues
If you encounter memory issues, you can:
1. Increase Docker memory limit
2. Reduce the number of services
3. Use production mode instead of development

## Security Considerations

1. **Change default passwords** in `.env`
2. **Use strong SESSION_SECRET** in production
3. **Configure SSL certificates** for HTTPS
4. **Limit database access** to application containers only
5. **Regular security updates** of base images

## Backup and Restore

### Database Backup
```bash
docker exec sdr-mysql mysqldump -u root -p southdelhirealestate > backup.sql
```

### Database Restore
```bash
docker exec -i sdr-mysql mysql -u root -p southdelhirealestate < backup.sql
```

### Volume Backup
```bash
docker run --rm -v sdr_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz -C /data .
```

## Monitoring

### Health Checks
All services include health checks. Check status:
```bash
docker ps
```

### Resource Usage
```bash
docker stats
```

### Logs
```bash
# Application logs
./docker-run.sh logs webapp

# Database logs
docker logs sdr-mysql
```
