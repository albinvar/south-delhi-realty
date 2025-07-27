#!/bin/bash

# Session Fix Test Script
echo "🧪 Testing Session Persistence Fix..."
echo "===================================="
echo ""

BASE_URL="https://southdelhirealty.com"
COOKIE_JAR="session_test_cookies.txt"

# Clean up any existing cookie file
rm -f $COOKIE_JAR

echo "1️⃣ Testing debug endpoint..."
curl -s -c $COOKIE_JAR "${BASE_URL}/api/auth/debug-session" | jq '.'
echo ""

echo "2️⃣ Testing login..."
LOGIN_RESPONSE=$(curl -s -c $COOKIE_JAR -b $COOKIE_JAR \
  -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"superadmin123"}')

echo "Login Response:"
echo $LOGIN_RESPONSE | jq '.'
echo ""

echo "3️⃣ Testing authentication status..."
STATUS_RESPONSE=$(curl -s -b $COOKIE_JAR "${BASE_URL}/api/auth/status")
echo "Status Response:"
echo $STATUS_RESPONSE | jq '.'
echo ""

echo "4️⃣ Testing admin dashboard access..."
DASHBOARD_RESPONSE=$(curl -s -b $COOKIE_JAR "${BASE_URL}/api/admin/dashboard")
echo "Dashboard Response:"
echo $DASHBOARD_RESPONSE | jq '.'
echo ""

echo "5️⃣ Testing debug endpoint after login..."
curl -s -b $COOKIE_JAR "${BASE_URL}/api/auth/debug-session" | jq '.'
echo ""

# Clean up
rm -f $COOKIE_JAR

echo "✅ Session test completed!"
echo ""
echo "🔍 What to look for:"
echo "- Login should return user data (not error)"
echo "- Status should return user data (not 401)"
echo "- Dashboard should return data (not 401)"
echo "- Debug endpoint should show session with passport data"
