# ============================================
# RGA Dashboard API Test Script
# ============================================
# PowerShell script สำหรับทดสอบ API

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "🧪 Testing RGA Dashboard API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   ✅ Health Check: OK" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Environment: $($response.environment)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health Check Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Make sure server is running: npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Bootstrap Status
Write-Host "2. Checking Bootstrap Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/bootstrap/status" -Method Get
    Write-Host "   ✅ Bootstrap Status: OK" -ForegroundColor Green
    Write-Host "   Is Bootstrapped: $($response.data.isBootstrapped)" -ForegroundColor Gray
    Write-Host "   Tenant Count: $($response.data.tenantCount)" -ForegroundColor Gray
    Write-Host "   User Count: $($response.data.userCount)" -ForegroundColor Gray
    
    if ($response.data.isBootstrapped) {
        Write-Host ""
        Write-Host "   ℹ️  System is already bootstrapped" -ForegroundColor Cyan
        Write-Host "   Use regular API endpoints to create additional tenants/users" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "   ℹ️  System is ready for bootstrap" -ForegroundColor Cyan
        Write-Host "   Run bootstrap to create first tenant and admin user" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Bootstrap Status Check Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Bootstrap (ถ้ายังไม่ bootstrapped)
if (-not $response.data.isBootstrapped) {
    Write-Host "3. Testing Bootstrap..." -ForegroundColor Yellow
    Write-Host "   ⚠️  Bootstrap requires manual input" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   To bootstrap, run:" -ForegroundColor Cyan
    Write-Host "   POST $baseUrl$apiPrefix/bootstrap" -ForegroundColor White
    Write-Host "   Body: {" -ForegroundColor Gray
    Write-Host "     `"tenantName`": `"Your Company Name`"," -ForegroundColor Gray
    Write-Host "     `"tenantSlug`": `"your-company`"," -ForegroundColor Gray
    Write-Host "     `"adminEmail`": `"admin@yourcompany.com`"," -ForegroundColor Gray
    Write-Host "     `"adminPassword`": `"YourSecurePassword123!`"," -ForegroundColor Gray
    Write-Host "     `"adminFirstName`": `"Admin`"," -ForegroundColor Gray
    Write-Host "     `"adminLastName`": `"User`"" -ForegroundColor Gray
    Write-Host "   }" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Or use: node scripts/setup.js" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ API Test Complete" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Make sure database is set up (run database/setup_rga_dashboard.sql)" -ForegroundColor White
Write-Host "2. Bootstrap system (POST /api/v1/bootstrap)" -ForegroundColor White
Write-Host "3. Login and test API with token" -ForegroundColor White
Write-Host ""

