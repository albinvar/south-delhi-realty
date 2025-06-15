#!/bin/bash

# DigitalOcean Deployment Script for South Delhi Real Estate
# This script sets up and deploys the application on a DigitalOcean droplet

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="south-delhi-real-estate"
APP_DIR="/var/www/$APP_NAME"
DIST_DIR="$APP_DIR/dist"
LOG_DIR="/var/log/pm2"
USER="www-data"

echo -e "${BLUE}🚀 Starting DigitalOcean deployment for $APP_NAME${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
else
    print_status "Node.js is already installed: $(node --version)"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
else
    print_status "PM2 is already installed: $(pm2 --version)"
fi

# Install Nginx (if not already installed)
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    apt-get install -y nginx
else
    print_status "Nginx is already installed"
fi

# Create application directory
print_status "Creating application directory..."
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
chown -R $USER:$USER $APP_DIR
chown -R $USER:$USER $LOG_DIR

# Create application user if doesn't exist
if ! id "$USER" &>/dev/null; then
    print_status "Creating application user: $USER"
    adduser --system --group --no-create-home $USER
fi

# Copy built application files
if [ -d "./dist" ]; then
    print_status "Copying application files..."
    cp -r ./dist/* $DIST_DIR/
    chown -R $USER:$USER $DIST_DIR
else
    print_error "No dist directory found. Please run 'npm run build' first."
    exit 1
fi

# Install production dependencies
print_status "Installing production dependencies..."
cd $DIST_DIR
npm install --production

# Copy environment file if it exists
if [ -f ".env" ]; then
    print_status "Environment file found in dist directory"
else
    print_warning "No .env file found. Please create one from .env.production template"
fi

# Start or restart the application with PM2
print_status "Starting application with PM2..."
if pm2 list | grep -q $APP_NAME; then
    print_status "Restarting existing PM2 process..."
    pm2 restart $APP_NAME
else
    print_status "Starting new PM2 process..."
    pm2 start ecosystem.config.cjs --env production
fi

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Create Nginx configuration
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration (you'll need to add your SSL certificates)
    # ssl_certificate /etc/ssl/certs/your-domain.crt;
    # ssl_certificate_key /etc/ssl/private/your-domain.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate proxy-revalidate;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Static files
    location /assets/ {
        alias $DIST_DIR/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /static/ {
        alias $DIST_DIR/public/;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t && systemctl restart nginx

# Enable Nginx to start on boot
systemctl enable nginx

# Setup UFW firewall
print_status "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Display status
print_status "Deployment completed successfully!"
print_status "Application is running on port 5000"
print_status "Nginx is configured as reverse proxy"

echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update your domain DNS to point to this server's IP"
echo "2. Install SSL certificates (Let's Encrypt recommended)"
echo "3. Update .env file with production values"
echo "4. Update Nginx config with your actual domain name"
echo ""
echo -e "${BLUE}📊 Useful commands:${NC}"
echo "• Check PM2 status: pm2 status"
echo "• View PM2 logs: pm2 logs $APP_NAME"
echo "• Restart app: pm2 restart $APP_NAME"
echo "• Check Nginx status: systemctl status nginx"
echo "• Test Nginx config: nginx -t"
echo ""
echo -e "${GREEN}🎉 Your South Delhi Real Estate application is now deployed!${NC}" 