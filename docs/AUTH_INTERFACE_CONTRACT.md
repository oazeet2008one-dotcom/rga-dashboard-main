# 📋 Authentication API Contract

**Version:** 2.0.0  
**Date:** 2026-01-14  
**Status:** 🟡 Pending Implementation  
**Based on:** [AUDIT_REPORT_AUTH.md](file:///C:/Users/User/.gemini/antigravity/brain/3f728205-888b-476d-92f2-3ced97712882/AUDIT_REPORT_AUTH.md)

---

## Executive Summary

This document defines the **Production-Grade API Contract** for the RGA Dashboard Authentication Module. It addresses all critical issues identified in the security audit:

| Issue | Resolution |
|-------|------------|
| 🔴 Password hash leak in Register | Sanitized `UserDto` - password field excluded |
| 🟡 HTTP 201 on Login | Changed to **200 OK** |
| 🟡 HTTP 201 on Refresh | Changed to **200 OK** |
| ⚠️ Inconsistent response format | Standardized `ApiResponse<T>` wrapper |

---

## 1. Endpoint Summary Table

| Method | Endpoint | Description | Success Status | Auth Required |
|--------|----------|-------------|----------------|---------------|
| `POST` | `/api/v1/auth/register` | Create new tenant + admin user | **201 Created** | ❌ No |
| `POST` | `/api/v1/auth/login` | Authenticate user | **200 OK** | ❌ No |
| `POST` | `/api/v1/auth/refresh` | Rotate access token | **200 OK** | ❌ No (uses refresh token in body) |
| `POST` | `/api/v1/auth/logout` | Invalidate session | **200 OK** | ✅ Yes |
| `POST` | `/api/v1/auth/logout-all` | Invalidate all sessions | **200 OK** | ✅ Yes |

---

## 2. Type Definitions (TypeScript Interfaces)

### 2.1 Standard API Response Wrapper

> [!IMPORTANT]
> **All API responses MUST use this wrapper.** The frontend [api-client.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/services/api-client.ts) interceptor depends on this structure.

```typescript
/**
 * Standard API Response Wrapper
 * Used by ResponseTransformInterceptor on backend
 * Auto-unwrapped by api-client.ts interceptor on frontend
 */
interface ApiResponse<T> {
  /** Indicates if the operation was successful */
  success: boolean;
  
  /** The actual response payload */
  data: T;
  
  /** Optional human-readable message */
  message?: string;
  
  /** Optional pagination metadata */
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

/**
 * Error Response (when success: false or HTTP 4xx/5xx)
 */
interface ApiErrorResponse {
  success: false;
  error: string;           // Error code (e.g., 'ACCOUNT_LOCKED', 'INVALID_TOKEN')
  message: string;         // Human-readable message
  statusCode: number;      // HTTP status code
  
  // Optional context for specific error types
  lockoutMinutes?: number;      // For ACCOUNT_LOCKED
  remainingAttempts?: number;   // For failed login attempts
}
```

---

### 2.2 User DTO (Sanitized)

> [!CAUTION]
> **CRITICAL SECURITY REQUIREMENT**  
> The `password` field and all internal security fields MUST NEVER be included in any API response.

```typescript
/**
 * Sanitized User DTO for API responses
 * ⚠️ SECURITY: password, failedLoginCount, lockedUntil MUST be excluded
 */
interface UserDto {
  /** UUID v4 */
  id: string;
  
  /** User email address */
  email: string;
  
  /** User display name */
  name: string;
  
  /** User role (ADMIN, MANAGER, VIEWER) */
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  
  /** Associated tenant/company */
  tenant: {
    id: string;
    name: string;
  };
}

/**
 * ❌ FORBIDDEN FIELDS - Never include in response
 * - password (bcrypt hash)
 * - failedLoginCount
 * - lockedUntil
 * - lastLoginIp
 * - lastLoginAt
 * - isActive (internal flag)
 * - tenantId (use nested tenant object instead)
 */
```

---

### 2.3 Authentication Token DTOs

```typescript
/**
 * JWT Token Pair
 */
interface AuthTokensDto {
  /** Short-lived access token (default: 15m) */
  accessToken: string;
  
  /** Long-lived refresh token (default: 7d) */
  refreshToken: string;
}

/**
 * Login Response - User + Tokens
 */
interface LoginResponseDto extends AuthTokensDto {
  user: UserDto;
}

/**
 * Register Response - Same as Login
 */
interface RegisterResponseDto extends AuthTokensDto {
  user: UserDto;
}

/**
 * Refresh Token Response - New Tokens Only
 */
interface RefreshTokenResponseDto extends AuthTokensDto {
  // No user object - client should already have it
}
```

---

### 2.4 Request DTOs

```typescript
/**
 * Login Request
 */
interface LoginRequestDto {
  /** Email address */
  email: string;
  
  /** Plain text password */
  password: string;
}

/**
 * Register Request
 */
interface RegisterRequestDto {
  /** Email address (unique) */
  email: string;
  
  /** Plain text password (min 8 chars) */
  password: string;
  
  /** User display name */
  name: string;
  
  /** Company/Tenant name */
  companyName: string;
}

/**
 * Refresh Token Request
 */
interface RefreshTokenRequestDto {
  /** Current refresh token */
  refreshToken: string;
}
```

---

## 3. JSON Response Examples

### 3.1 Login - Success (200 OK)

**Request:**
```http
POST /api/v1/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "admin@rga.co.th",
  "password": "SecurePassword123!"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: ~640 bytes

{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@rga.co.th",
      "name": "Admin User",
      "role": "ADMIN",
      "tenant": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "RGA Company"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFkbWluQHJnYS5jby50aCIsImlhdCI6MTcwNTE1NzYwMCwiZXhwIjoxNzA1MTU4NTAwfQ.xxx",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFkbWluQHJnYS5jby50aCIsImlhdCI6MTcwNTE1NzYwMCwiZXhwIjoxNzA1NzYyNDAwfQ.yyy"
  },
  "message": "Login successful"
}
```

---

### 3.2 Register - Success (201 Created)

**Request:**
```http
POST /api/v1/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "newuser@company.com",
  "password": "SecurePassword123!",
  "name": "New User",
  "companyName": "New Company Ltd."
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "user": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "email": "newuser@company.com",
      "name": "New User",
      "role": "ADMIN",
      "tenant": {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "New Company Ltd."
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

> [!WARNING]
> **SECURITY VALIDATION CHECKLIST**
> - ✅ No `password` field in response
> - ✅ No `failedLoginCount` field
> - ✅ No `lockedUntil` field
> - ✅ No `lastLoginIp` field
> - ✅ No `isActive` field

---

### 3.3 Refresh Token - Success (200 OK)

**Request:**
```http
POST /api/v1/auth/refresh HTTP/1.1
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(new, rotated)"
  },
  "message": "Token refreshed successfully"
}
```

---

### 3.4 Logout - Success (200 OK)

**Request:**
```http
POST /api/v1/auth/logout HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

## 4. Error Handling Specifications

### 4.1 Error Status Code Matrix

| Scenario | HTTP Status | Error Code | Description |
|----------|-------------|------------|-------------|
| Invalid credentials (wrong email/password) | **401 Unauthorized** | `INVALID_CREDENTIALS` | Generic message to prevent user enumeration |
| Account locked (brute force) | **403 Forbidden** | `ACCOUNT_LOCKED` | Include `lockoutMinutes` in response |
| Email already registered | **409 Conflict** | `EMAIL_EXISTS` | For registration only |
| Validation error (missing fields) | **400 Bad Request** | `VALIDATION_ERROR` | Include field-level errors |
| Invalid/Expired access token | **401 Unauthorized** | `TOKEN_EXPIRED` | Triggers refresh flow |
| Invalid/Revoked refresh token | **401 Unauthorized** | `INVALID_REFRESH_TOKEN` | Force re-login |
| Server error | **500 Internal Server Error** | `INTERNAL_ERROR` | Generic error, log details server-side |

---

### 4.2 Error Response Examples

#### 4.2.1 Invalid Credentials (401)

```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "statusCode": 401,
  "remainingAttempts": 3
}
```

#### 4.2.2 Account Locked (403)

```json
{
  "success": false,
  "error": "ACCOUNT_LOCKED",
  "message": "Account is locked due to too many failed attempts",
  "statusCode": 403,
  "lockoutMinutes": 30
}
```

#### 4.2.3 Email Already Exists (409)

```json
{
  "success": false,
  "error": "EMAIL_EXISTS",
  "message": "Email address is already registered",
  "statusCode": 409
}
```

#### 4.2.4 Validation Error (400)

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

#### 4.2.5 Token Expired (401)

```json
{
  "success": false,
  "error": "TOKEN_EXPIRED",
  "message": "Access token has expired",
  "statusCode": 401
}
```

---

## 5. Security Requirements

### 5.1 Response Sanitization Rules

```typescript
/**
 * Fields that MUST be excluded from User responses
 * Implementation: Use Prisma select or class-transformer @Exclude()
 */
const FORBIDDEN_USER_FIELDS = [
  'password',           // CRITICAL: bcrypt hash
  'failedLoginCount',   // Internal security metric
  'lockedUntil',        // Internal security state
  'lastLoginIp',        // PII - internal logging only
  'lastLoginAt',        // Internal metadata
  'isActive',           // Internal flag
  'tenantId',           // Use nested tenant object instead
  'createdAt',          // Internal metadata (optional)
  'updatedAt',          // Internal metadata (optional)
];
```

### 5.2 JWT Payload Specification

```typescript
/**
 * Access Token Payload (Minimal)
 */
interface AccessTokenPayload {
  sub: string;      // User ID
  email: string;    // User email
  iat: number;      // Issued at (Unix timestamp)
  exp: number;      // Expiration (Unix timestamp)
}

/**
 * Refresh Token Payload
 */
interface RefreshTokenPayload {
  sub: string;      // User ID
  email: string;    // User email
  iat: number;      // Issued at
  exp: number;      // Expiration
}

// ⚠️ DO NOT include: role, tenantId, or any sensitive data in JWT
// Fetch fresh data from DB using sub (userId) when needed
```

### 5.3 Token Configuration

| Token Type | Default Expiry | Environment Variable |
|------------|----------------|----------------------|
| Access Token | 15 minutes | `JWT_ACCESS_EXPIRY` |
| Refresh Token | 7 days | `JWT_REFRESH_EXPIRY` |

---

## 6. Frontend Integration Guide

### 6.1 api-client.ts Interceptor Behavior

```typescript
// The existing interceptor auto-unwraps responses:
// 
// Backend sends:  { success: true, data: {...}, message: "..." }
// Frontend gets:  {...}  (just the inner data)
//
// This means services receive the unwrapped data directly:

// Example: auth-store.ts login action
const response = await apiClient.post('/auth/login', { email, password });

// After interceptor unwrap, response.data contains:
// {
//   user: { id, email, name, role, tenant },
//   accessToken: "...",
//   refreshToken: "..."
// }

const { accessToken, refreshToken, user } = response.data;
```

### 6.2 Expected Frontend Types

```typescript
// frontend/src/types/auth.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  tenant: {
    id: string;
    name: string;
  };
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
```

---

## 7. Implementation Checklist

### Backend Changes Required

- [ ] **auth.controller.ts**: Add `@HttpCode(HttpStatus.OK)` to [login](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/stores/auth-store.ts#63-103) method
- [ ] **auth.controller.ts**: Add `@HttpCode(HttpStatus.OK)` to [refresh](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/auth.controller.ts#26-29) method
- [ ] **auth.service.ts**: Sanitize [register](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/auth.service.ts#26-49) response (exclude password)
- [ ] **auth/dto/**: Create `UserResponseDto` with explicit field mapping
- [ ] **Validation**: Ensure all DTOs have proper class-validator decorators

### Frontend Changes Required

- [ ] **types/auth.ts**: Add/update TypeScript interfaces to match contract
- [ ] **auth-store.ts**: Verify destructuring matches contract structure
- [ ] **Error handling**: Update error handlers for new error codes

---

## Appendix: Comparison Table

| Aspect | Current (Audit) | Target (Contract) |
|--------|-----------------|-------------------|
| Login Status | 201 Created ❌ | 200 OK ✅ |
| Refresh Status | 201 Created ❌ | 200 OK ✅ |
| Register Status | 201 Created ✅ | 201 Created ✅ |
| Register User Fields | Raw Prisma entity (with password) ❌ | Sanitized UserDto ✅ |
| Response Wrapper | `{ success, data, message }` ✅ | `{ success, data, message }` ✅ |
| Error Format | Inconsistent ⚠️ | Standardized ApiErrorResponse ✅ |

---

**End of Contract Document**
