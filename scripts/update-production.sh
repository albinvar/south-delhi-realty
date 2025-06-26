#!/bin/bash

# South Delhi Real Estate - Production Update Script
# This script updates the production server with the latest build (WebSocket removed)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
APP_NAME="south-delhi-realty"
APP_DIR="/var/www/$APP_NAME"
DIST_DIR="$APP_DIR/dist"
USER="app"
SERVER_IP=""

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Update production server with latest build (WebSocket removed)"
    echo ""
    echo "Options:"
    echo "  -s, --server IP       Server IP address"
    echo "  -u, --user USER       SSH user (default: app)"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --server 192.168.1.100"
    echo "  $0 -s 192.168.1.100 -u root"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server)
            SERVER_IP="$2"
            shift 2
            ;;
        -u|--user)
            USER="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$SERVER_IP" ]; then
    print_error "Server IP is required. Use -s or --server option."
    show_help
    exit 1
fi

print_status "🚀 South Delhi Real Estate - Production Update"
print_status "Target Server: $USER@$SERVER_IP"
print_status "App Directory: $APP_DIR"

# Check if dist directory exists locally
if [ ! -d "./dist" ]; then
    print_status "Building application first..."
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Build failed. Please fix build errors first."
        exit 1
    fi
    print_success "Build completed successfully"
fi

# Create backup of current production files
print_status "Creating backup of current production files..."
ssh $USER@$SERVER_IP "
    if [ -d '$DIST_DIR' ]; then
        sudo cp -r $DIST_DIR $APP_DIR/dist.backup.$(date +%Y%m%d_%H%M%S)
        echo 'Backup created successfully'
    else
        echo 'No existing dist directory found, skipping backup'
    fi
"

# Stop the application
print_status "Stopping application..."
ssh $USER@$SERVER_IP "
    if command -v pm2 &> /dev/null; then
        pm2 stop $APP_NAME || echo 'PM2 process not running'
    fi
"

# Upload new build files
print_status "Uploading new build files..."
rsync -avz --delete ./dist/ $USER@$SERVER_IP:$DIST_DIR/
if [ $? -ne 0 ]; then
    print_error "Failed to upload files. Restoring backup..."
    ssh $USER@$SERVER_IP "
        if [ -d '$APP_DIR/dist.backup.*' ]; then
            sudo rm -rf $DIST_DIR
            sudo mv $APP_DIR/dist.backup.* $DIST_DIR
        fi
    "
    exit 1
fi

# Set proper permissions
print_status "Setting proper permissions..."
ssh $USER@$SERVER_IP "
    sudo chown -R $USER:$USER $DIST_DIR
    sudo chmod -R 755 $DIST_DIR
"

# Install/update dependencies in production
print_status "Installing production dependencies..."
ssh $USER@$SERVER_IP "
    cd $DIST_DIR
    npm install --production --silent
"

# Start the application
print_status "Starting application..."
ssh $USER@$SERVER_IP "
    cd $DIST_DIR
    if command -v pm2 &> /dev/null; then
        pm2 start ecosystem.config.cjs --env production || pm2 restart $APP_NAME
        pm2 save
    else
        print_warning 'PM2 not found. Please start the application manually.'
    fi
"

# Health check
print_status "Performing health check..."
sleep 10
HEALTH_CHECK=$(ssh $USER@$SERVER_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/health || echo '000'")

if [ "$HEALTH_CHECK" = "200" ]; then
    print_success "✅ Application is healthy and running!"
    print_success "🎉 Production update completed successfully!"
    
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Test Google OAuth: https://southdelhirealty.com/auth"
    echo "2. Check admin login: https://southdelhirealty.com/admin"
    echo "3. Monitor logs: ssh $USER@$SERVER_IP 'pm2 logs $APP_NAME'"
    
    echo ""
    echo -e "${GREEN}✨ WebSocket code has been successfully removed!${NC}"
    echo -e "${GREEN}✨ Your application is now cleaner and more efficient!${NC}"
else
    print_error "❌ Health check failed (HTTP $HEALTH_CHECK)"
    print_error "Application may not be running properly"
    
    echo ""
    echo -e "${YELLOW}🔍 Troubleshooting steps:${NC}"
    echo "1. Check application logs: ssh $USER@$SERVER_IP 'pm2 logs $APP_NAME'"
    echo "2. Check PM2 status: ssh $USER@$SERVER_IP 'pm2 status'"
    echo "3. Restart manually: ssh $USER@$SERVER_IP 'cd $DIST_DIR && pm2 restart $APP_NAME'"
    
    exit 1
fi

# Clean up old backups (keep last 3)
print_status "Cleaning up old backups..."
ssh $USER@$SERVER_IP "
    cd $APP_DIR
    ls -t dist.backup.* 2>/dev/null | tail -n +4 | xargs -r rm -rf
    echo 'Backup cleanup completed'
" || true

print_status "🚀 Production update completed!" 