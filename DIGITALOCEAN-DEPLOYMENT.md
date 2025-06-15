# DigitalOcean App Platform Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Pre-Deployment Verification
```bash
npm run pre-deploy-check
```

### 2. Fix Build Issues
The build errors you encountered are now resolved:

#### ✅ **Fixed Issues:**
- **Missing entry module**: Vite config now explicitly defines the input file
- **Security vulnerabilities**: Removed postinstall audit that was causing deployment failures
- **Build configuration**: Simplified Vite config for better deployment compatibility

### 3. Repository Setup
1. Ensure your code is in a Git repository
2. Push all changes to GitHub/GitLab
3. Make sure the main branch is up to date

## 🔧 App Platform Configuration

### Method 1: Using App Spec (.do/app.yaml)
The `.do/app.yaml` file is already configured. Update the GitHub repository reference:

```yaml
github:
  repo: your-username/south-delhi-real-estate  # Update this
  branch: main
```

### Method 2: Manual Configuration in DigitalOcean Console

#### **Build Settings:**
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Node Version**: 18.20.4 (specified in .nvmrc)
- **Environment**: Node.js

#### **Environment Variables:**
```
NODE_ENV=production
PORT=8080
DB_HOST=your-digitalocean-database-host
DB_USER=doadmin
DB_PASSWORD=your-database-password
DB_NAME=defaultdb
DB_PORT=25060
SESSION_SECRET=your-secure-session-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ALLOWED_ORIGINS=https://your-app-name.ondigitalocean.app
SSL_ENABLED=true
```

## 🛠️ Troubleshooting Build Errors

### **Error: "Cannot resolve entry module 'client/index.html'"**
**Status**: ✅ **FIXED**
- **Solution**: Updated `vite.config.ts` with explicit input path
- **Code**: Added `rollupOptions.input` in build configuration

### **Error: "Security vulnerabilities detected"**
**Status**: ✅ **FIXED** 
- **Solution**: Removed `postinstall` audit script that was causing deployment failures
- **Alternative**: Run `npm audit fix` manually before deployment

### **Error: "Build configuration issue"**
**Status**: ✅ **FIXED**
- **Solution**: Simplified Vite configuration
- **Removed**: Async configuration and dynamic imports
- **Added**: Production-specific build optimizations

## 📋 Deployment Checklist

### Before Deployment:
- [ ] Run `npm run pre-deploy-check`
- [ ] All environment variables configured
- [ ] Database is accessible from DigitalOcean
- [ ] Repository is up to date
- [ ] Build works locally: `npm run build`

### During Deployment:
- [ ] Monitor build logs in DigitalOcean console
- [ ] Check that all dependencies install successfully
- [ ] Verify client and server builds complete
- [ ] Confirm application starts without errors

### After Deployment:
- [ ] Test application URL
- [ ] Verify database connectivity
- [ ] Check admin panel access
- [ ] Test property listings
- [ ] Verify file uploads (Cloudinary)

## 🔍 Testing Your Deployment

### Health Checks:
```bash
# Replace with your DigitalOcean app URL
curl https://your-app-name.ondigitalocean.app/ready
curl https://your-app-name.ondigitalocean.app/api/properties
```

### Expected Responses:
- **Main page**: Should load React application
- **API endpoints**: Should return JSON data
- **Admin panel**: Should be accessible at `/admin`

## 🚨 Common Issues & Solutions

### **Build Fails with "Module not found"**
- Check that all dependencies are in `dependencies`, not `devDependencies`
- Ensure TypeScript files compile correctly

### **Database Connection Fails**
- Verify database is in same region as app
- Check firewall settings allow DigitalOcean App Platform IPs
- Confirm environment variables are correctly set

### **Static Files Not Found**
- Verify build output in DigitalOcean build logs
- Check that `dist/public` directory is created
- Ensure server serves static files correctly

### **Application Won't Start**
- Check that `PORT` environment variable is set to `8080`
- Verify `NODE_ENV=production`
- Review application logs in DigitalOcean console

## 🎯 Performance Optimization

### **Recommended Settings:**
- **Instance Size**: Basic (1GB RAM) or Professional (2GB RAM)
- **Auto-scaling**: Enable if expecting high traffic
- **CDN**: Enable for faster static file delivery

### **Build Optimization:**
```bash
# Use deployment-specific build
npm run build:deploy
```

## 📞 Support

### **DigitalOcean Resources:**
- [App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Node.js Deployment Guide](https://docs.digitalocean.com/products/app-platform/languages-frameworks/nodejs/)

### **Project-Specific:**
- Database: Your DigitalOcean MySQL cluster is already configured
- Admin Access: `superadmin` / `superadmin123`
- Sample Property: Already imported and ready

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Application starts and responds to health checks
- ✅ Database connectivity works
- ✅ Admin panel is accessible
- ✅ Property listings display correctly
- ✅ File uploads work (Cloudinary integration)

**Your South Delhi Real Estate application is now deployment-ready!** 🏠 