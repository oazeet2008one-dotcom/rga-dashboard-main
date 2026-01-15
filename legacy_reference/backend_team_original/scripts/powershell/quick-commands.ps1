# ============================================
# Quick Commands Helper
# ============================================
# Script สำหรับแสดงคำสั่งที่ใช้บ่อย

Write-Host "🚀 RGA Dashboard Quick Commands" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Available Scripts:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  .\complete-test.ps1          - Bootstrap + Login + Test" -ForegroundColor White
Write-Host "  .\quick-login.ps1           - Login quickly" -ForegroundColor White
Write-Host "  .\test-with-token-fixed.ps1 - Test API with token" -ForegroundColor White
Write-Host "  .\create-user.ps1           - Create new user" -ForegroundColor White
Write-Host "  .\list-users.ps1            - List all users" -ForegroundColor White
Write-Host "  .\run-tests-now.ps1         - Quick bootstrap and test" -ForegroundColor White
Write-Host ""

Write-Host "🔑 Current Token Status:" -ForegroundColor Yellow
if ($env:RGA_API_TOKEN) {
    Write-Host "  ✅ Token available" -ForegroundColor Green
    Write-Host "  Token: $($env:RGA_API_TOKEN.Substring(0, 30))..." -ForegroundColor Gray
    
    # Decode tenant ID
    try {
        $tokenParts = $env:RGA_API_TOKEN.Split('.')
        $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
        $tokenData = $payload | ConvertFrom-Json
        Write-Host "  Tenant ID: $($tokenData.tenantId)" -ForegroundColor Gray
        Write-Host "  User Email: $($tokenData.email)" -ForegroundColor Gray
        Write-Host "  Role: $($tokenData.role)" -ForegroundColor Gray
    } catch {
        Write-Host "  ⚠️  Cannot decode token" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ No token found" -ForegroundColor Red
    Write-Host "  Run: .\quick-login.ps1" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "📝 Common Tasks:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create User:" -ForegroundColor Cyan
Write-Host "   .\create-user.ps1" -ForegroundColor White
Write-Host ""
Write-Host "2. List Users:" -ForegroundColor Cyan
Write-Host "   .\list-users.ps1" -ForegroundColor White
Write-Host ""
Write-Host "3. Test API:" -ForegroundColor Cyan
Write-Host "   .\test-with-token-fixed.ps1" -ForegroundColor White
Write-Host ""
Write-Host "4. Login:" -ForegroundColor Cyan
Write-Host "   .\quick-login.ps1" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "  - NEXT_STEPS.md - Next steps guide" -ForegroundColor White
Write-Host "  - API_SETUP_GUIDE.md - API documentation" -ForegroundColor White
Write-Host "  - TESTING_GUIDE.md - Testing guide" -ForegroundColor White
Write-Host ""

