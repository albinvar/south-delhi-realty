# Session Persistence Fix - Deployment Guide

## Problem
After successful login (POST /api/auth/login returns 200), all subsequent authenticated requests return 401 Unauthorized. This indicates that the session is not being persisted properly between requests.

## Root Cause
The session configuration was too restrictive:
- `resave: false` - Prevented session from being saved if not modified
- `saveUninitialized: false` - Prevented uninitialized sessions from being saved
- No explicit session saving in login process

## Solution Applied

### 1. Updated Session Configuration (server/index.ts)
```typescript
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: true,           // CHANGED: Force session save even if not modified
  saveUninitialized: true, // CHANGED: Save uninitialized sessions
  store: storage.sessionStore,
  name: 'southdelhi.session',
  proxy: true,
  rolling: true,          // ADDED: Reset cookie Max-Age on every request
  cookie: {
    secure: false,
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    domain: undefined,
    path: '/'             // ADDED: Ensure cookie available for all paths
  }
};
```

### 2. Enhanced Login Process (server/auth.ts)
```typescript
req.logIn(user, (err) => {
  if (err) {
    // ... error handling
  }
  
  // ADDED: Manually save the session to ensure it's persisted
  req.session.save((saveErr) => {
    if (saveErr) {
      // ... error handling
    }
    
    console.log('✅ Session saved successfully');
    return res.json(user);
  });
});
```

### 3. Added Session Debug Endpoint (server/auth.ts)
```typescript
// GET /api/auth/debug-session
// Returns detailed session information for debugging
```

### 4. Enhanced Session Debugging (server/index.ts)
- Added detailed cookie information to session debug logs
- Added Set-Cookie headers tracking
- Enhanced session state monitoring

## Deployment Steps

### Step 1: Upload Updated Files
Upload the entire `dist` folder to your server, ensuring these files are updated:
- `dist/server/index.js` (updated session config)
- `dist/server/auth.js` (updated login process)
- `dist/.env` (environment variables)

### Step 2: Restart Docker Containers
```bash
# On your server
docker-compose down
docker-compose up -d
```

### Step 3: Test the Fix
1. Go to https://southdelhirealty.com/auth
2. Login with superadmin/superadmin123
3. Check that you stay logged in (no 401 errors)
4. Test the debug endpoint: https://southdelhirealty.com/api/auth/debug-session

### Step 4: Monitor Logs
```bash
# Check server logs
docker-compose logs -f app

# Look for session debugging info like:
# "✅ Session saved successfully"
# "📊 Session Debug: { sessionID: '...', passport: {...} }"
```

## Testing Commands

### Quick Test (PowerShell/Command Prompt)
```powershell
# Test debug endpoint
curl https://southdelhirealty.com/api/auth/debug-session

# Test login
curl -X POST https://southdelhirealty.com/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"superadmin\",\"password\":\"superadmin123\"}"
```

### Comprehensive Test (Use test-session-fix.sh)
Run the provided `test-session-fix.sh` script to perform a full session persistence test.

## What to Look For

### Success Indicators
- Login returns user data (not error)
- `/api/auth/status` returns user data (not 401)
- `/api/admin/dashboard` returns data (not 401)
- Debug endpoint shows session with passport data
- Server logs show "✅ Session saved successfully"

### Failure Indicators
- Continued 401 errors after successful login
- Debug endpoint shows session without passport data
- Server logs show session save errors

## Troubleshooting

### If the fix doesn't work:
1. Check that the updated files were properly uploaded
2. Verify Docker containers restarted with new code
3. Check server logs for session-related errors
4. Test the debug endpoint to see session state
5. Ensure MemoryStore is working properly

### Common Issues:
- **Files not uploaded**: Ensure the entire `dist` folder is updated
- **Docker not restarted**: Run `docker-compose down && docker-compose up -d`
- **Environment variables**: Ensure `.env` file is in the `dist` folder
- **Session store issues**: Check logs for MemoryStore errors

## Files Modified
- `server/index.ts` - Session configuration
- `server/auth.ts` - Login process and debug endpoint
- `deploy-session-fix.sh` - Deployment script
- `test-session-fix.sh` - Testing script

## Next Steps After Deployment
1. Test login functionality thoroughly
2. Monitor server logs for any session-related issues
3. Test email functionality (should already be working)
4. Verify all admin features work correctly
5. Consider moving to database-backed session store for production scaling
