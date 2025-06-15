# Fix 502 Bad Gateway Error - Production Deployment

## 🚨 Current Issue
Your production server at `https://southdelhirealty.com` is returning a 502 Bad Gateway error because it needs to be updated with the latest build that has WebSocket code removed.

## ✅ Quick Fix for DigitalOcean App Platform

### Option 1: Force Redeploy via DigitalOcean Console (Fastest)

1. **Login to DigitalOcean Console**
   - Go to https://cloud.digitalocean.com/apps
   - Find your "south-delhi-realty" app

2. **Trigger Manual Deployment**
   - Click on your app
   - Go to "Settings" tab
   - Click "Actions" → "Force Rebuild and Deploy"
   - Wait for deployment to complete (5-10 minutes)

### Option 2: Deploy via Git Push (Recommended)

1. **Ensure Latest Code is Committed**
   ```bash
   git add .
   git commit -m "Remove WebSocket code - fix 502 error"
   git push origin main
   ```

2. **DigitalOcean will auto-deploy**
   - Check the "Activity" tab in DigitalOcean console
   - Wait for "Deploy" to show "Success"

## 🔍 Verification Steps

1. **Check Health Endpoint**
   ```bash
   curl https://southdelhirealty.com/health
   ```
   Should return: `{"status":"healthy"}`

2. **Test Google OAuth**
   - Visit: https://southdelhirealty.com/auth
   - Click "Continue with Google"
   - Should redirect properly without 502 error

3. **Test Admin Login**
   - Visit: https://southdelhirealty.com/auth
   - Use credentials: `superadmin` / `superadmin123`

## 📊 Environment Variables Check

Ensure these are set in DigitalOcean App Platform:

```env
NODE_ENV=production
PORT=8080
GOOGLE_CALLBACK_URL=https://southdelhirealty.com/api/auth/google/callback
DB_HOST=south-delhi-realty-do-user-23263628-0.d.db.ondigitalocean.com
DB_PORT=25060
DB_USER=doadmin
DB_PASSWORD=AVNS_HAUMTlBFyavWasfJRHr
DB_NAME=defaultdb
SESSION_SECRET=your-secure-session-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret
```

## 🛠️ If Issues Persist

### Check Application Logs
1. Go to DigitalOcean Console → Your App → "Runtime Logs"
2. Look for any error messages
3. Common issues:
   - Missing environment variables
   - Database connection errors
   - Build failures

### Manual Restart
1. In DigitalOcean Console
2. Go to your app → "Settings"
3. Click "Actions" → "Restart"

## 🎯 Expected Results After Fix

- ✅ `https://southdelhirealty.com/health` returns 200 OK
- ✅ `https://southdelhirealty.com/auth` loads without 502 error
- ✅ Google OAuth callback works: `/api/auth/google/callback`
- ✅ Admin login works with superadmin/superadmin123
- ✅ No WebSocket-related errors in logs

## 📞 Emergency Contact

If the issue persists after trying these steps:

1. **Check Runtime Logs** in DigitalOcean console
2. **Verify Database Connection** - ensure MySQL database is running
3. **Check Environment Variables** - especially GOOGLE_CALLBACK_URL

The 502 error should be resolved once the latest build (without WebSocket code) is deployed to production.

---

**Note**: The 502 error is happening because the old production build still contains WebSocket code that we removed. Once the new build is deployed, the application will run much more efficiently without the unused WebSocket server. 