param(
    [string]$BaseUrl = "http://localhost:3001/api/v1",
    [string]$TenantId,
    [string]$Email,
    [string]$Password,
    [string]$FirstName = "Test",
    [string]$LastName = "User"
)

Write-Host "=============================================="
Write-Host " RGA Dashboard - Register + Verify + Login"
Write-Host "=============================================="

function Get-PlainPassword {
    if ($Password) { return $Password }
    $secure = Read-Host "Enter password" -AsSecureString
    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

if (-not $Email) {
    $Email = Read-Host "Enter email"
}
$PasswordPlain = Get-PlainPassword
if (-not $TenantId) {
    $TenantId = Read-Host "Enter tenant ID"
}

$headers = @{ "Content-Type" = "application/json" }

function Invoke-Api {
    param(
        [string]$Url,
        [string]$Method,
        $Body = $null,
        $Headers = $headers
    )

    try {
        if ($Body) {
            $json = $Body | ConvertTo-Json -Depth 10
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $json
        }
        else {
            return Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        if ($_.Exception.Response -and $_.Exception.Response.ContentLength -gt 0) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host ($reader.ReadToEnd()) -ForegroundColor DarkRed
        }
        throw
    }
}

Write-Host "\nStep 1: Registering user..." -ForegroundColor Yellow
$registerBody = @{
    email = $Email
    password = $PasswordPlain
    tenantId = $TenantId
    firstName = $FirstName
    lastName = $LastName
}
$registerResponse = Invoke-Api "$BaseUrl/auth/register" "POST" $registerBody
Write-Host "Registration successful." -ForegroundColor Green
if ($registerResponse.user) {
    Write-Host "User ID: $($registerResponse.user.id)"
    Write-Host "Email Verified: $($registerResponse.user.emailVerified)"
}

$verificationToken = $registerResponse.verificationToken
if ($verificationToken) {
    Write-Host "\nStep 2: Verifying email (development mode)..." -ForegroundColor Yellow
    $verifyResponse = Invoke-Api "$BaseUrl/auth/verify-email" "POST" @{ token = $verificationToken }
    Write-Host "Email verified." -ForegroundColor Green
}
else {
    Write-Host "\nNo verification token returned. Check your email for the verification link." -ForegroundColor Yellow
}

Write-Host "\nStep 3: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = $Email
    password = $PasswordPlain
    tenantId = $TenantId
}
$loginResponse = Invoke-Api "$BaseUrl/auth/login" "POST" $loginBody
$token = $loginResponse.token
Write-Host "Login successful." -ForegroundColor Green
Write-Host "Email Verified: $($loginResponse.user.emailVerified)"
Write-Host "Role: $($loginResponse.user.role)"

if ($token) {
    Write-Host "\nJWT Token:"
    Write-Host $token
    $env:RGA_API_TOKEN = $token
    Write-Host "Token stored in environment variable RGA_API_TOKEN"
}

Write-Host "\nDone. You can now call protected endpoints using the token." -ForegroundColor Cyan
