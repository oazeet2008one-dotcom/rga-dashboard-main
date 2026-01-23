$ErrorActionPreference = "Stop"
try {
    Write-Host "1. Logging in..."
    $body = @{ email = "admin@rga.com"; password = "password123" } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    $token = $login.accessToken
    if (-not $token) { throw "No access token received" }
    Write-Host "   Login successful. Token acquired."

    Write-Host "`n2. Testing Seed Heavy (Count=100)..."
    $seedBody = @{ count = 100 } | ConvertTo-Json
    $seed = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/verify/seed-heavy" -Method Post -Body $seedBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "   Seed Response: $($seed | ConvertTo-Json -Depth 2)"

    Write-Host "`n3. Testing Trigger Alert..."
    $alert = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/verify/trigger-alert-now" -Method Post -Headers @{ Authorization = "Bearer $token" }
    Write-Host "   Alert Response: $($alert | ConvertTo-Json -Depth 2)"

    Write-Host "`n✅ All verification tests completed successfully."
} catch {
    Write-Host "`n❌ Error: $_"
    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Details: $($reader.ReadToEnd())"
    }
}
