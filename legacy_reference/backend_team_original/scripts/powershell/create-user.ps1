# ============================================
# Create User Script
# ============================================
# Script สำหรับสร้าง user ใหม่

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "👤 Create New User" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบ token
$token = $env:RGA_API_TOKEN
if (-not $token) {
    Write-Host "❌ No token found!" -ForegroundColor Red
    Write-Host "Please login first: .\quick-login.ps1" -ForegroundColor Yellow
    exit 1
}

# Get tenant ID from token
$tokenParts = $token.Split('.')
$payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
$tokenData = $payload | ConvertFrom-Json
$tenantId = $tokenData.tenantId

Write-Host "Tenant ID: $tenantId" -ForegroundColor Gray
Write-Host ""

# รับข้อมูล user
$email = Read-Host "Enter email"
$password = Read-Host "Enter password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)
$firstName = Read-Host "Enter first name"
$lastName = Read-Host "Enter last name"
$role = Read-Host "Enter role (viewer/manager/admin_user/admin_full/super_admin) [default: viewer]"
if (-not $role) { $role = "viewer" }

Write-Host ""
Write-Host "Creating user..." -ForegroundColor Yellow

$body = @{
    email = $email
    password = $passwordPlain
    firstName = $firstName
    lastName = $lastName
    role = $role
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "x-tenant-id" = $tenantId
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/users" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host ""
    Write-Host "✅ User created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "User Details:" -ForegroundColor Cyan
    Write-Host "  ID: $($response.user.id)" -ForegroundColor White
    Write-Host "  Email: $($response.user.email)" -ForegroundColor White
    Write-Host "  Name: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor White
    Write-Host "  Role: $($response.user.role)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Failed to create user!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Details: $($errorDetails.error.message)" -ForegroundColor Red
        } catch {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

