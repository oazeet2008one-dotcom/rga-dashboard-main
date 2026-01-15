# ============================================
# Auto Setup Script - Bootstrap, Login, Test
# ============================================
# Script สำหรับทำทุกอย่างอัตโนมัติ

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "🚀 RGA Dashboard Auto Setup & Test" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่า server ทำงานอยู่หรือไม่
Write-Host "1. Checking server status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 5
    Write-Host "   ✅ Server is running" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Server is not running!" -ForegroundColor Red
    Write-Host "   Please start server first: npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ตรวจสอบ Bootstrap Status
Write-Host "2. Checking bootstrap status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/bootstrap/status" -Method Get
    $isBootstrapped = $status.data.isBootstrapped
    $tenantCount = $status.data.tenantCount
    $userCount = $status.data.userCount
    
    Write-Host "   Is Bootstrapped: $isBootstrapped" -ForegroundColor Gray
    Write-Host "   Tenant Count: $tenantCount" -ForegroundColor Gray
    Write-Host "   User Count: $userCount" -ForegroundColor Gray
    Write-Host ""
    
    if (-not $isBootstrapped) {
        Write-Host "   ⚠️  System not bootstrapped yet" -ForegroundColor Yellow
        Write-Host "   Starting bootstrap..." -ForegroundColor Cyan
        Write-Host ""
        
        # Bootstrap with default values
        $bootstrapBody = @{
            tenantName = "RGA Company"
            tenantSlug = "rga-company"
            adminEmail = "admin@rga.com"
            adminPassword = "Admin@123456"
            adminFirstName = "Admin"
            adminLastName = "User"
        } | ConvertTo-Json
        
        try {
            $bootstrapResponse = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/bootstrap" `
                -Method Post `
                -ContentType "application/json" `
                -Body $bootstrapBody
            
            $tenantId = $bootstrapResponse.data.tenant.id
            $token = $bootstrapResponse.data.token
            
            Write-Host "   ✅ Bootstrap successful!" -ForegroundColor Green
            Write-Host "   Tenant: $($bootstrapResponse.data.tenant.name) ($($bootstrapResponse.data.tenant.slug))" -ForegroundColor Gray
            Write-Host "   Admin: $($bootstrapResponse.data.user.email)" -ForegroundColor Gray
            Write-Host "   Tenant ID: $tenantId" -ForegroundColor Gray
            Write-Host ""
            
            # เก็บข้อมูลไว้ใช้
            $env:RGA_API_TOKEN = $token
            $env:RGA_TENANT_ID = $tenantId
            $env:RGA_ADMIN_EMAIL = $bootstrapResponse.data.user.email
            
        } catch {
            Write-Host "   ❌ Bootstrap failed!" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                try {
                    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
                    Write-Host "   Details: $($errorDetails.message)" -ForegroundColor Red
                } catch {
                    Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
                }
            }
            exit 1
        }
    } else {
        Write-Host "   ✅ System already bootstrapped" -ForegroundColor Green
        Write-Host ""
        
        # Login with default credentials
        Write-Host "3. Logging in..." -ForegroundColor Yellow
        
        $loginBody = @{
            email = "admin@rga.com"
            password = "Admin@123456"
            tenantId = ""  # Will need to get from first tenant
        } | ConvertTo-Json
        
        # Get first tenant ID
        try {
            # Try to get tenants (might need auth, so we'll use bootstrap endpoint info)
            Write-Host "   ⚠️  Please login manually:" -ForegroundColor Yellow
            Write-Host "   Email: admin@rga.com" -ForegroundColor White
            Write-Host "   Password: Admin@123456" -ForegroundColor White
            Write-Host "   Tenant ID: (get from database or bootstrap response)" -ForegroundColor White
            Write-Host ""
            Write-Host "   Or run: .\quick-login.ps1" -ForegroundColor Cyan
            Write-Host ""
            
            # Skip login for now, user needs to provide tenant ID
            $skipLogin = $true
        } catch {
            $skipLogin = $true
        }
        
        if (-not $skipLogin) {
            try {
                $loginResponse = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/auth/login" `
                    -Method Post `
                    -ContentType "application/json" `
                    -Body $loginBody
                
                $token = $loginResponse.token
                $env:RGA_API_TOKEN = $token
                
                Write-Host "   ✅ Login successful!" -ForegroundColor Green
                Write-Host ""
            } catch {
                Write-Host "   ❌ Login failed!" -ForegroundColor Red
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "   Please login manually: .\quick-login.ps1" -ForegroundColor Yellow
                exit 1
            }
        }
    }
} catch {
    Write-Host "   ❌ Cannot check bootstrap status" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ทดสอบ API (ถ้ามี token)
if ($env:RGA_API_TOKEN) {
    Write-Host "4. Testing API with token..." -ForegroundColor Yellow
    Write-Host ""
    
    $token = $env:RGA_API_TOKEN
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $testResults = @()
    
    # Test 1: Get Current User
    Write-Host "   Testing Get Current User..." -ForegroundColor Cyan
    try {
        $user = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/auth/me" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        Write-Host "   ✅ Get Current User: OK - $($user.user.email)" -ForegroundColor Green
        $testResults += @{ Test = "Get Current User"; Status = "✅ Pass"; Details = $user.user.email }
    } catch {
        Write-Host "   ❌ Get Current User: Failed - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Get Current User"; Status = "❌ Fail"; Details = $_.Exception.Message }
    }
    
    # Test 2: Get Users
    Write-Host "   Testing Get Users..." -ForegroundColor Cyan
    try {
        $users = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/users" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        Write-Host "   ✅ Get Users: OK - $($users.users.Count) users" -ForegroundColor Green
        $testResults += @{ Test = "Get Users"; Status = "✅ Pass"; Details = "$($users.users.Count) users" }
    } catch {
        Write-Host "   ❌ Get Users: Failed - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Get Users"; Status = "❌ Fail"; Details = $_.Exception.Message }
    }
    
    # Test 3: Get Tenants
    Write-Host "   Testing Get Tenants..." -ForegroundColor Cyan
    try {
        $tenants = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/tenants" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        Write-Host "   ✅ Get Tenants: OK - $($tenants.tenants.Count) tenants" -ForegroundColor Green
        $testResults += @{ Test = "Get Tenants"; Status = "✅ Pass"; Details = "$($tenants.tenants.Count) tenants" }
    } catch {
        Write-Host "   ❌ Get Tenants: Failed - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Get Tenants"; Status = "❌ Fail"; Details = $_.Exception.Message }
    }
    
    # Test 4: Get Campaigns
    Write-Host "   Testing Get Campaigns..." -ForegroundColor Cyan
    try {
        $campaigns = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/campaigns" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        $count = if ($campaigns.campaigns) { $campaigns.campaigns.Count } else { 0 }
        Write-Host "   ✅ Get Campaigns: OK - $count campaigns" -ForegroundColor Green
        $testResults += @{ Test = "Get Campaigns"; Status = "✅ Pass"; Details = "$count campaigns" }
    } catch {
        Write-Host "   ❌ Get Campaigns: Failed - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Get Campaigns"; Status = "❌ Fail"; Details = $_.Exception.Message }
    }
    
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    foreach ($result in $testResults) {
        Write-Host "$($result.Status) $($result.Test): $($result.Details)" -ForegroundColor $(if ($result.Status -eq "✅ Pass") { "Green" } else { "Red" })
    }
    Write-Host ""
    
} else {
    Write-Host "4. ⚠️  No token available for API testing" -ForegroundColor Yellow
    Write-Host "   Please login first: .\quick-login.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "✅ Auto Setup Complete!" -ForegroundColor Green
Write-Host ""

if ($env:RGA_API_TOKEN) {
    Write-Host "Token saved in: `$env:RGA_API_TOKEN" -ForegroundColor Cyan
    Write-Host "To use in future sessions:" -ForegroundColor Yellow
    Write-Host '  $env:RGA_API_TOKEN = "' + $env:RGA_API_TOKEN + '"' -ForegroundColor White
    Write-Host ""
}

if ($env:RGA_TENANT_ID) {
    Write-Host "Tenant ID saved in: `$env:RGA_TENANT_ID" -ForegroundColor Cyan
    Write-Host "Tenant ID: $($env:RGA_TENANT_ID)" -ForegroundColor White
    Write-Host ""
}

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  - Use token to access API: .\test-api-with-token.ps1" -ForegroundColor White
Write-Host "  - Login again: .\quick-login.ps1" -ForegroundColor White
Write-Host ""

