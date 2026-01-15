# ============================================
# RGA Dashboard API Test Script with Token
# ============================================
# PowerShell script สำหรับทดสอบ API ด้วย token

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "🧪 Testing RGA Dashboard API with Token" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่ามี token หรือไม่
$token = $env:RGA_API_TOKEN

if (-not $token) {
    Write-Host "⚠️  No token found in environment variable RGA_API_TOKEN" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please set token first:" -ForegroundColor Cyan
    Write-Host '  $env:RGA_API_TOKEN = "your-token-here"' -ForegroundColor White
    Write-Host ""
    Write-Host "Or login first to get token:" -ForegroundColor Cyan
    Write-Host ""
    
    # ถามว่าต้องการ login หรือไม่
    $login = Read-Host "Do you want to login now? (y/n)"
    if ($login -eq "y" -or $login -eq "Y") {
        $email = Read-Host "Enter email"
        $password = Read-Host "Enter password" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        )
        $tenantId = Read-Host "Enter tenant ID"
        
        try {
            $loginBody = @{
                email = $email
                password = $passwordPlain
                tenantId = $tenantId
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/auth/login" `
                -Method Post `
                -ContentType "application/json" `
                -Body $loginBody
            
            $token = $response.token
            $env:RGA_API_TOKEN = $token
            
            Write-Host ""
            Write-Host "✅ Login successful!" -ForegroundColor Green
            Write-Host "Token saved to environment variable RGA_API_TOKEN" -ForegroundColor Gray
            Write-Host ""
        } catch {
            Write-Host ""
            Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "   Error: $($errorDetails.message)" -ForegroundColor Red
            }
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "Please set token or login first" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Using token: $($token.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# Headers สำหรับ API requests
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 1. Get Current User
Write-Host "1. Testing Get Current User..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/auth/me" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ Get Current User: OK" -ForegroundColor Green
    Write-Host "   User: $($response.user.email) ($($response.user.role))" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Get Current User Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorDetails.message)" -ForegroundColor Red
    }
}
Write-Host ""

# 2. Get Users
Write-Host "2. Testing Get Users..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/users" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ Get Users: OK" -ForegroundColor Green
    Write-Host "   Total Users: $($response.users.Count)" -ForegroundColor Gray
    foreach ($user in $response.users) {
        Write-Host "   - $($user.email) ($($user.role))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Get Users Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Get Tenants
Write-Host "3. Testing Get Tenants..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/tenants" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ Get Tenants: OK" -ForegroundColor Green
    Write-Host "   Total Tenants: $($response.tenants.Count)" -ForegroundColor Gray
    foreach ($tenant in $response.tenants) {
        Write-Host "   - $($tenant.name) ($($tenant.slug))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Get Tenants Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Get Campaigns
Write-Host "4. Testing Get Campaigns..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/campaigns" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ Get Campaigns: OK" -ForegroundColor Green
    if ($response.campaigns) {
        Write-Host "   Total Campaigns: $($response.campaigns.Count)" -ForegroundColor Gray
    } else {
        Write-Host "   No campaigns found" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Get Campaigns Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Get Metrics
Write-Host "5. Testing Get Metrics..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/metrics" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ Get Metrics: OK" -ForegroundColor Green
    if ($response.metrics) {
        Write-Host "   Total Metrics: $($response.metrics.Count)" -ForegroundColor Gray
    } else {
        Write-Host "   No metrics found" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Get Metrics Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 6. Get Alerts
Write-Host "6. Testing Get Alerts..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/alerts" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "   ✅ Get Alerts: OK" -ForegroundColor Green
    if ($response.alerts) {
        Write-Host "   Total Alerts: $($response.alerts.Count)" -ForegroundColor Gray
    } else {
        Write-Host "   No alerts found" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Get Alerts Failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ API Test Complete" -ForegroundColor Green
Write-Host ""
Write-Host "Token saved in: `$env:RGA_API_TOKEN" -ForegroundColor Cyan
Write-Host "To use in future sessions:" -ForegroundColor Yellow
Write-Host '  $env:RGA_API_TOKEN = "your-token-here"' -ForegroundColor White
Write-Host ""

