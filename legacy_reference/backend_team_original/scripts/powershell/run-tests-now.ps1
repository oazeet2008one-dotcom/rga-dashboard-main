# ============================================
# Quick Test Script - Run after server starts
# ============================================

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "🧪 RGA Dashboard Quick Test" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Bootstrap Status
Write-Host "1. Checking bootstrap status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/bootstrap/status" -Method Get
    $isBootstrapped = $status.data.isBootstrapped
    
    Write-Host "   Is Bootstrapped: $isBootstrapped" -ForegroundColor Gray
    Write-Host "   Tenant Count: $($status.data.tenantCount)" -ForegroundColor Gray
    Write-Host "   User Count: $($status.data.userCount)" -ForegroundColor Gray
    Write-Host ""
    
    if (-not $isBootstrapped) {
        Write-Host "   ⚠️  System not bootstrapped yet" -ForegroundColor Yellow
        Write-Host "   Starting bootstrap..." -ForegroundColor Cyan
        Write-Host ""
        
        # Bootstrap
        $bootstrapBody = @{
            tenantName = "RGA Company"
            tenantSlug = "rga-company"
            adminEmail = "admin@rga.com"
            adminPassword = "Admin@123456"
            adminFirstName = "Admin"
            adminLastName = "User"
        } | ConvertTo-Json
        
        $bootstrap = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/bootstrap" `
            -Method Post `
            -ContentType "application/json" `
            -Body $bootstrapBody
        
        $env:RGA_API_TOKEN = $bootstrap.data.token
        $env:RGA_TENANT_ID = $bootstrap.data.tenant.id
        
        Write-Host "   ✅ Bootstrap successful!" -ForegroundColor Green
        Write-Host "   Tenant: $($bootstrap.data.tenant.name)" -ForegroundColor Gray
        Write-Host "   Admin: $($bootstrap.data.user.email)" -ForegroundColor Gray
        Write-Host "   Token saved to `$env:RGA_API_TOKEN" -ForegroundColor Gray
        Write-Host ""
        
        $token = $env:RGA_API_TOKEN
    } else {
        Write-Host "   ✅ System already bootstrapped" -ForegroundColor Green
        Write-Host ""
        Write-Host "   ⚠️  Please login to get token:" -ForegroundColor Yellow
        Write-Host "   Run: .\quick-login.ps1" -ForegroundColor Cyan
        Write-Host ""
        exit 0
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Test API with Token
if ($token) {
    Write-Host "2. Testing API with token..." -ForegroundColor Yellow
    Write-Host ""
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Test Get Current User
    Write-Host "   Testing Get Current User..." -ForegroundColor Cyan
    try {
        $user = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/auth/me" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        Write-Host "   ✅ Get Current User: OK - $($user.user.email)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Get Current User: Failed" -ForegroundColor Red
    }
    
    # Test Get Users
    Write-Host "   Testing Get Users..." -ForegroundColor Cyan
    try {
        $users = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/users" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        Write-Host "   ✅ Get Users: OK - $($users.users.Count) users" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Get Users: Failed" -ForegroundColor Red
    }
    
    # Test Get Tenants
    Write-Host "   Testing Get Tenants..." -ForegroundColor Cyan
    try {
        $tenants = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/tenants" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        Write-Host "   ✅ Get Tenants: OK - $($tenants.tenants.Count) tenants" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Get Tenants: Failed" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "===========================" -ForegroundColor Cyan
    Write-Host "✅ All tests completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Checklist Status:" -ForegroundColor Yellow
    Write-Host "  [x] Bootstrap" -ForegroundColor Green
    Write-Host "  [x] Login (token from bootstrap)" -ForegroundColor Green
    Write-Host "  [x] Test API with token" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "2. ⚠️  No token available" -ForegroundColor Yellow
}

Write-Host "Token: $($env:RGA_API_TOKEN)" -ForegroundColor Gray
Write-Host ""

