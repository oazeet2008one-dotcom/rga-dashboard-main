# ============================================
# Complete API Test Script
# ============================================
# Script สำหรับทดสอบ API แบบครบวงจร (Bootstrap -> Login -> Test)

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "🧪 RGA Dashboard Complete API Test" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. ตรวจสอบ Bootstrap Status
Write-Host "1. Checking Bootstrap Status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/bootstrap/status" -Method Get
    Write-Host "   ✅ Status: OK" -ForegroundColor Green
    Write-Host "   Is Bootstrapped: $($status.data.isBootstrapped)" -ForegroundColor Gray
    Write-Host "   Tenant Count: $($status.data.tenantCount)" -ForegroundColor Gray
    Write-Host "   User Count: $($status.data.userCount)" -ForegroundColor Gray
    Write-Host ""
    
    if (-not $status.data.isBootstrapped) {
        Write-Host "   ⚠️  System not bootstrapped yet" -ForegroundColor Yellow
        Write-Host ""
        $bootstrap = Read-Host "Do you want to bootstrap now? (y/n)"
        
        if ($bootstrap -eq "y" -or $bootstrap -eq "Y") {
            Write-Host ""
            Write-Host "2. Bootstrapping..." -ForegroundColor Yellow
            
            $tenantName = Read-Host "Enter tenant name (default: Test Company)"
            if (-not $tenantName) { $tenantName = "Test Company" }
            
            $tenantSlug = Read-Host "Enter tenant slug (default: test-company)"
            if (-not $tenantSlug) { $tenantSlug = "test-company" }
            
            $adminEmail = Read-Host "Enter admin email (default: admin@test.com)"
            if (-not $adminEmail) { $adminEmail = "admin@test.com" }
            
            $adminPassword = Read-Host "Enter admin password (default: Admin@123456)" -AsSecureString
            if (-not $adminPassword) {
                $adminPassword = ConvertTo-SecureString "Admin@123456" -AsPlainText -Force
            }
            $adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
            )
            
            $adminFirstName = Read-Host "Enter admin first name (default: Admin)"
            if (-not $adminFirstName) { $adminFirstName = "Admin" }
            
            $adminLastName = Read-Host "Enter admin last name (default: User)"
            if (-not $adminLastName) { $adminLastName = "User" }
            
            $bootstrapBody = @{
                tenantName = $tenantName
                tenantSlug = $tenantSlug
                adminEmail = $adminEmail
                adminPassword = $adminPasswordPlain
                adminFirstName = $adminFirstName
                adminLastName = $adminLastName
            } | ConvertTo-Json
            
            try {
                $bootstrapResponse = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/bootstrap" `
                    -Method Post `
                    -ContentType "application/json" `
                    -Body $bootstrapBody
                
                $tenantId = $bootstrapResponse.data.tenant.id
                $token = $bootstrapResponse.data.token
                $env:RGA_API_TOKEN = $token
                
                Write-Host ""
                Write-Host "   ✅ Bootstrap successful!" -ForegroundColor Green
                Write-Host "   Tenant ID: $tenantId" -ForegroundColor Gray
                Write-Host "   Token saved to `$env:RGA_API_TOKEN" -ForegroundColor Gray
                Write-Host ""
            } catch {
                Write-Host ""
                Write-Host "   ❌ Bootstrap failed: $($_.Exception.Message)" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host ""
            Write-Host "   ⚠️  Cannot proceed without bootstrap" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "   ✅ System already bootstrapped" -ForegroundColor Green
        Write-Host ""
        
        # Login
        Write-Host "2. Logging in..." -ForegroundColor Yellow
        $email = Read-Host "Enter email"
        $password = Read-Host "Enter password" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        )
        $tenantId = Read-Host "Enter tenant ID"
        
        $loginBody = @{
            email = $email
            password = $passwordPlain
            tenantId = $tenantId
        } | ConvertTo-Json
        
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
            Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "   ❌ Cannot connect to server" -ForegroundColor Red
    Write-Host "   Make sure server is running: npm run dev" -ForegroundColor Yellow
    exit 1
}

# 3. ทดสอบ API
Write-Host "3. Testing API with token..." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Get Current User
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

# Get Users
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

# Get Tenants
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
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "✅ Complete API Test Finished!" -ForegroundColor Green
Write-Host ""
Write-Host "Token saved in: `$env:RGA_API_TOKEN" -ForegroundColor Cyan
Write-Host ""

