# South Delhi Real Estate Platform

A modern, full-stack real estate application built with React, Node.js, Express, and MySQL. Features property listings, admin management, inquiry system, and media uploads.

## 🚀 Production Deployment (DigitalOcean Ready)

This application is now fully configured for DigitalOcean deployment with all TypeScript errors resolved and proper production builds.

### Quick Deployment

1. **Build the application:**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy to DigitalOcean:**
   ```bash
   # Upload files to your droplet
   scp -r dist/ root@your-droplet-ip:/tmp/
   scp scripts/deploy-digitalocean.sh root@your-droplet-ip:/tmp/
   
   # Run deployment script
   ssh root@your-droplet-ip
   cd /tmp && chmod +x deploy-digitalocean.sh && ./deploy-digitalocean.sh
   ```

3. **Configure environment variables:**
   - Copy `.env.production` to `.env` on your droplet
   - Update with your database credentials, domain, and API keys

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🛠️ Recent Fixes Applied

### TypeScript Build Issues Resolved ✅
- Fixed Express type conflicts in `server/routes.ts` using type assertions
- Resolved web-vitals API imports in performance optimizer
- Fixed property schema type errors in property detail page
- Corrected password field types in staff management
- Updated CommonJS compatibility for production builds

### Deployment Configuration ✅
- Updated TypeScript configuration for CommonJS output
- Created deployment preparation script
- Added PM2 ecosystem configuration
- Configured Nginx reverse proxy setup
- Added SSL and security configurations

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter
- **UI Library:** Radix UI + Tailwind CSS
- **State Management:** TanStack Query
- **Forms:** React Hook Form + Zod validation

### Backend (Node.js + Express)
- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MySQL with Drizzle ORM
- **Authentication:** Passport.js (Local + Google OAuth)
- **File Storage:** Cloudinary
- **Process Management:** PM2

### Database Schema
- **Properties:** Core property listings with media relations
- **Users:** Role-based access (staff, admin, superadmin)
- **Inquiries:** Customer inquiry management
- **Media:** Property images/videos with Cloudinary integration
- **Facilities:** Nearby amenities and locations

## 📋 Features

### Public Features
- **Property Listings:** Browse properties with advanced filtering
- **Property Details:** Detailed view with image galleries and maps
- **Inquiry System:** Contact forms with email notifications
- **SEO Optimized:** Meta tags, sitemap, structured data
- **Responsive Design:** Mobile-first responsive UI

### Admin Features
- **Property Management:** CRUD operations for properties
- **Media Management:** Upload images/videos with watermarking
- **User Management:** Role-based user administration
- **Inquiry Management:** View and manage customer inquiries
- **Dashboard:** Analytics and overview statistics

### Security Features
- **Authentication:** Secure login with session management
- **Authorization:** Role-based access control
- **Input Validation:** Zod schema validation
- **CSRF Protection:** Express security middleware
- **Rate Limiting:** API endpoint protection

## 💻 Development

### Prerequisites
- Node.js 18+
- MySQL 8+
- npm or yarn

### Local Setup
```bash
# Clone repository
git clone <repository-url>
cd south-delhi-real-estate

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Update .env with your database credentials

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:studio    # Open Drizzle Studio
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=southdelhirealestate
DB_PORT=3306

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret

# Session & Security
SESSION_SECRET=your-session-secret
ALLOWED_ORIGINS=http://localhost:3000

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE southdelhirealestate;

# Run migrations (if available)
npm run db:migrate

# Create superadmin user
npm run init-superadmin
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Property Endpoints
- `GET /api/properties` - List properties with filtering
- `GET /api/properties/:slug` - Get property by slug
- `POST /api/admin/properties` - Create property (admin)
- `PUT /api/admin/properties/:id` - Update property (admin)
- `DELETE /api/admin/properties/:id` - Delete property (admin)

### Inquiry Endpoints
- `POST /api/inquiries` - Submit inquiry
- `GET /api/admin/inquiries` - List inquiries (admin)
- `PUT /api/admin/inquiries/:id` - Update inquiry (admin)

## 🚀 Production Deployment

### DigitalOcean Deployment
1. **Droplet Requirements:**
   - Ubuntu 20.04+ LTS
   - Minimum: 2GB RAM, 1 vCPU
   - Recommended: 4GB RAM, 2 vCPU

2. **Services Required:**
   - DigitalOcean Managed Database (MySQL)
   - Domain name with DNS pointing to droplet
   - Cloudinary account for media storage

3. **Deployment Process:**
```bash
   # Build application
   npm run build
   
   # Deploy using script
   ./scripts/deploy-digitalocean.sh
   ```

### Manual Deployment
1. **Server Setup:**
```bash
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   
   # Install PM2 and Nginx
   npm install -g pm2
   apt-get install -y nginx
   ```

2. **Application Deployment:**
```bash
   # Copy files to server
   scp -r dist/ user@server:/var/www/app/
   
   # Start with PM2
   cd /var/www/app
   pm2 start ecosystem.config.cjs --env production
   ```

### SSL Setup
```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com
```

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status              # Check application status
pm2 logs                # View logs
pm2 restart app         # Restart application
pm2 monit              # Monitor in real-time
```

### Health Checks
- `GET /ready` - Application readiness check
- `GET /metrics` - Basic application metrics

## 🔍 Troubleshooting

### Common Issues
1. **Build Errors:** Ensure all TypeScript errors are resolved
2. **Database Connection:** Verify credentials and network access
3. **File Uploads:** Check Cloudinary configuration
4. **SSL Issues:** Verify certificate installation and Nginx config

### Log Locations
- **PM2 Logs:** `/var/log/pm2/`
- **Nginx Logs:** `/var/log/nginx/`
- **Application Logs:** Check PM2 logs

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure build passes
5. Submit a pull request

## 📞 Support

For technical support or deployment assistance, please check the troubleshooting section in [DEPLOYMENT.md](./DEPLOYMENT.md) or create an issue.

---

**Ready for Production Deployment! 🚀**

This application has been thoroughly tested and configured for DigitalOcean deployment with all TypeScript errors resolved and proper security configurations in place. 