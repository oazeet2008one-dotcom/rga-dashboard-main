# ============================================
# Quick Login Script
# ============================================
# Script สำหรับ login และเก็บ token

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "🔐 RGA Dashboard Login" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# รับข้อมูลจาก user
$email = Read-Host "Enter email"
$password = Read-Host "Enter password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)
$tenantId = Read-Host "Enter tenant ID"

Write-Host ""
Write-Host "Logging in..." -ForegroundColor Yellow

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
    Write-Host ""
    Write-Host "User Information:" -ForegroundColor Cyan
    Write-Host "  Email: $($response.user.email)" -ForegroundColor White
    Write-Host "  Name: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor White
    Write-Host "  Role: $($response.user.role)" -ForegroundColor White
    Write-Host "  Tenant ID: $($response.user.tenantId)" -ForegroundColor White
    Write-Host ""
    Write-Host "Token saved to: `$env:RGA_API_TOKEN" -ForegroundColor Green
    Write-Host ""
    Write-Host "To use token in other scripts:" -ForegroundColor Yellow
    Write-Host '  $env:RGA_API_TOKEN = "' + $token + '"' -ForegroundColor White
    Write-Host ""
    Write-Host "To test API:" -ForegroundColor Yellow
    Write-Host "  .\test-api-with-token.ps1" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Details: $($errorDetails.message)" -ForegroundColor Red
        } catch {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. Email and password are correct" -ForegroundColor White
    Write-Host "  2. Tenant ID is correct" -ForegroundColor White
    Write-Host "  3. Server is running" -ForegroundColor White
    Write-Host ""
}

