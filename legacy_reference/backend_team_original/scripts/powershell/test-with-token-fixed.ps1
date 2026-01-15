# ============================================
# Fixed API Test Script
# ============================================

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "🧪 Testing API with Token" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# ใช้ token จาก bootstrap
$token = $env:RGA_API_TOKEN

if (-not $token) {
    Write-Host "❌ No token found!" -ForegroundColor Red
    Write-Host "Please bootstrap first or login" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using token: $($token.Substring(0, 30))..." -ForegroundColor Gray
Write-Host ""

# Get tenant ID from token (decode JWT)
$tokenParts = $token.Split('.')
$payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
$tokenData = $payload | ConvertFrom-Json
$tenantId = $tokenData.tenantId

Write-Host "Tenant ID: $tenantId" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "x-tenant-id" = $tenantId
}

# Test 1: Get Users (should work)
Write-Host "1. Testing Get Users..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/users" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ Get Users: OK" -ForegroundColor Green
    Write-Host "   Total Users: $($users.users.Count)" -ForegroundColor Gray
    foreach ($u in $users.users) {
        Write-Host "   - $($u.email) ($($u.role))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Get Users: Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Get Tenants
Write-Host "2. Testing Get Tenants..." -ForegroundColor Yellow
try {
    $tenants = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/tenants" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ Get Tenants: OK" -ForegroundColor Green
    Write-Host "   Total Tenants: $($tenants.tenants.Count)" -ForegroundColor Gray
    foreach ($t in $tenants.tenants) {
        Write-Host "   - $($t.name) ($($t.slug))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Get Tenants: Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Campaigns
Write-Host "3. Testing Get Campaigns..." -ForegroundColor Yellow
try {
    $campaigns = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/campaigns" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    $count = if ($campaigns.campaigns) { $campaigns.campaigns.Count } else { 0 }
    Write-Host "   ✅ Get Campaigns: OK - $count campaigns" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Get Campaigns: Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Metrics
Write-Host "4. Testing Get Metrics..." -ForegroundColor Yellow
try {
    $metrics = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/metrics" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    $count = if ($metrics.metrics) { $metrics.metrics.Count } else { 0 }
    Write-Host "   ✅ Get Metrics: OK - $count metrics" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Get Metrics: Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Alerts
Write-Host "5. Testing Get Alerts..." -ForegroundColor Yellow
try {
    $alerts = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/alerts" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    $count = if ($alerts.alerts) { $alerts.alerts.Count } else { 0 }
    Write-Host "   ✅ Get Alerts: OK - $count alerts" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Get Alerts: Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "===========================" -ForegroundColor Cyan
Write-Host "✅ API Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Checklist Status:" -ForegroundColor Yellow
Write-Host "  [x] Bootstrap" -ForegroundColor Green
Write-Host "  [x] Login (token from bootstrap)" -ForegroundColor Green
Write-Host "  [x] Test API with token" -ForegroundColor Green
Write-Host ""

