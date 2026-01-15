# ============================================
# List Users Script
# ============================================
# Script สำหรับดู users ทั้งหมด

$baseUrl = "http://localhost:3001"
$apiPrefix = "/api/v1"

Write-Host "👥 List All Users" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
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

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "x-tenant-id" = $tenantId
}

try {
    $response = Invoke-RestMethod -Uri "$baseUrl$apiPrefix/users" `
        -Method Get `
        -Headers $headers
    
    Write-Host "Total Users: $($response.users.Count)" -ForegroundColor Green
    Write-Host ""
    
    if ($response.users.Count -eq 0) {
        Write-Host "No users found" -ForegroundColor Yellow
    } else {
        Write-Host "Users:" -ForegroundColor Cyan
        Write-Host "------" -ForegroundColor Cyan
        foreach ($user in $response.users) {
            Write-Host ""
            Write-Host "  Email: $($user.email)" -ForegroundColor White
            Write-Host "  Name: $($user.firstName) $($user.lastName)" -ForegroundColor Gray
            Write-Host "  Role: $($user.role)" -ForegroundColor Gray
            Write-Host "  Active: $($user.isActive)" -ForegroundColor Gray
            Write-Host "  Created: $($user.createdAt)" -ForegroundColor Gray
        }
    }
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get users!" -ForegroundColor Red
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

