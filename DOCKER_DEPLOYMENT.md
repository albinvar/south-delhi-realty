# Docker Deployment Guide - South Delhi Real Estate

## Quick Start

### Prerequisites
- Docker installed
- Docker Compose installed
- At least 4GB RAM available
- Ports 7822, 3306, and 8080 available

### Deployment Steps

1. **Clone and navigate to the project directory:**
   ```bash
   cd /path/to/SouthDelhiRealEstate
   ```

2. **Start the complete stack:**
   ```bash
   ./docker-deploy.sh
   ```
   
   Or manually:
   ```bash
   docker-compose up --build -d
   ```

3. **Access the application:**
   - **Main Application**: http://localhost:7822
   - **Database Admin (phpMyAdmin)**: http://localhost:8080
   - **Database Direct Access**: localhost:3306

### Services Included

1. **Application Container** (`southdelhirealty-app`)
   - Node.js application with Express server
   - Built with multi-stage Docker build
   - Includes all session fixes and database optimizations
   - Runs on port 7822

2. **Database Container** (`southdelhirealty-db`)
   - MySQL 8.0 with automatic initialization
   - Pre-loaded with sample properties and admin user
   - Persistent data storage
   - Runs on port 3306

3. **Database Admin** (`southdelhirealty-phpmyadmin`)
   - phpMyAdmin for database management
   - Runs on port 8080
   - Username: root, Password: root_secure_password_456

### Configuration

#### Database Credentials
- **Host**: database (internal), localhost (external)
- **Database**: southdel_main
- **Username**: southdel_main
- **Password**: secure_password_123
- **Root Password**: root_secure_password_456

#### Default Admin Login
- **Email**: admin@southdelhirealty.com
- **Password**: admin123

### Management Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f database

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up --build -d

# Remove everything (including data)
docker-compose down -v --rmi all
```

### Troubleshooting

1. **Port conflicts**: 
   - Change ports in docker-compose.yml if 7822, 3306, or 8080 are in use

2. **Database connection issues**:
   - Wait 60-90 seconds for database to fully initialize
   - Check logs: `docker-compose logs database`

3. **Application not starting**:
   - Check application logs: `docker-compose logs app`
   - Ensure database is healthy: `docker-compose ps`

4. **Out of space**:
   - Clean unused Docker resources: `docker system prune -a`

### File Structure

```
.
├── docker-compose.yml      # Main Docker Compose configuration
├── Dockerfile             # Application container definition
├── docker-deploy.sh       # Deployment script
├── docker-init.sql        # Database initialization
├── .env.docker           # Docker environment variables
└── migrations/           # Database migration files
```

### Production Considerations

1. **Security**:
   - Change default passwords in docker-compose.yml
   - Update SESSION_SECRET in environment variables
   - Use proper SSL certificates

2. **Performance**:
   - Adjust memory limits in docker-compose.yml
   - Monitor container resource usage
   - Consider using external database for production

3. **Backup**:
   - Backup mysql_data volume regularly
   - Export database using phpMyAdmin
   - Backup uploaded files from uploads/ directory

### Monitoring

- **Health Checks**: Built-in health checks for all services
- **Status Check**: `docker-compose ps`
- **Resource Usage**: `docker stats`
- **Service Health**: Access http://localhost:7822/health

### Development vs Production

For development, you can:
- Mount source code as volumes for hot reload
- Use nodemon for automatic restarts
- Enable debug logging

For production:
- Use proper SSL/TLS
- Set up monitoring and alerting
- Use external database with backups
- Implement log rotation
