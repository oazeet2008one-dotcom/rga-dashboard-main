#!/bin/bash
# ============================================
# RGA Dashboard API Test Script
# ============================================
# Bash script สำหรับทดสอบ API

BASE_URL="http://localhost:3001"
API_PREFIX="/api/v1"

echo "🧪 Testing RGA Dashboard API"
echo "================================"
echo ""

# 1. Health Check
echo "1. Testing Health Check..."
if curl -s -f "$BASE_URL/health" > /dev/null; then
    echo "   ✅ Health Check: OK"
    curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/health"
else
    echo "   ❌ Health Check Failed"
    echo "   ⚠️  Make sure server is running: npm run dev"
    exit 1
fi
echo ""

# 2. Bootstrap Status
echo "2. Checking Bootstrap Status..."
STATUS_RESPONSE=$(curl -s "$BASE_URL$API_PREFIX/bootstrap/status")
if [ $? -eq 0 ]; then
    echo "   ✅ Bootstrap Status: OK"
    echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
    
    IS_BOOTSTRAPPED=$(echo "$STATUS_RESPONSE" | jq -r '.data.isBootstrapped' 2>/dev/null)
    if [ "$IS_BOOTSTRAPPED" = "true" ]; then
        echo ""
        echo "   ℹ️  System is already bootstrapped"
    else
        echo ""
        echo "   ℹ️  System is ready for bootstrap"
        echo "   Run bootstrap to create first tenant and admin user"
    fi
else
    echo "   ❌ Bootstrap Status Check Failed"
fi
echo ""

echo "================================"
echo "✅ API Test Complete"
echo ""
echo "Next Steps:"
echo "1. Make sure database is set up (run database/setup_rga_dashboard.sql)"
echo "2. Bootstrap system (POST $BASE_URL$API_PREFIX/bootstrap)"
echo "3. Login and test API with token"
echo ""

