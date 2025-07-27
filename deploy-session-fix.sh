#!/bin/bash

# ===================================
# SESSION PERSISTENCE FIX DEPLOYMENT
# ===================================

echo "🚀 Deploying Session Persistence Fix..."
echo "========================================"
echo ""

# Step 1: Stop the running containers
echo "🛑 Step 1: Stopping Docker containers..."
docker-compose down
echo "✅ Containers stopped"
echo ""

# Step 2: Backup current deployment (optional but recommended)
echo "💾 Step 2: Creating backup..."
if [ -d "dist_backup" ]; then
    rm -rf dist_backup
fi
cp -r dist dist_backup
echo "✅ Backup created at dist_backup/"
echo ""

# Step 3: Copy new build files
echo "📁 Step 3: Uploading new build files..."
echo "ℹ️  You need to upload the updated 'dist' folder from your local machine"
echo "    Make sure the following files are updated:"
echo "    - dist/server/index.js (updated session config)"
echo "    - dist/server/auth.js (updated login process)"
echo "    - dist/.env (environment variables)"
echo ""

# Step 4: Start containers
echo "🚀 Step 4: Starting Docker containers..."
docker-compose up -d
echo "✅ Containers started"
echo ""

# Step 5: Check logs
echo "📋 Step 5: Checking logs..."
echo "🔍 Checking server logs (press Ctrl+C to stop)..."
docker-compose logs -f app

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Testing Instructions:"
echo "1. Go to https://southdelhirealty.com/auth"
echo "2. Try to login with superadmin/superadmin123"
echo "3. Check browser console for any errors"
echo "4. Check server logs for session debugging info"
echo "5. Test the debug endpoint: GET /api/auth/debug-session"
echo ""
echo "🐛 If issues persist:"
echo "- Check docker logs: docker-compose logs app"
echo "- Test debug endpoint: curl https://southdelhirealty.com/api/auth/debug-session"
echo "- Verify session store is working: look for MemoryStore logs"
echo ""
