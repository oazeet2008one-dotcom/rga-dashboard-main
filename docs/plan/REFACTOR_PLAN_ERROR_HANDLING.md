# Refactor Plan: Error Handling Standardization

**Phase:** Step 2 (Planning)  
**Status:** Ready for Implementation  
**Created:** 2026-01-20  
**Prerequisite:** [AUDIT_REPORT_API_LAYER.md](../audit/AUDIT_REPORT_API_LAYER.md)

---

## Executive Summary

This plan addresses the **critical error handling mismatch** identified in the API Layer Audit. The goal is to standardize error responses so the Frontend receives structured, actionable error data.

> [!IMPORTANT]
> **Good News:** The `GlobalExceptionFilter` and `BusinessException` already exist in the codebase but are **NOT registered**. This significantly reduces implementation effort.

---

## 1. Unified Error Schema (The Contract)

### Interface Definition

```typescript
// backend/src/common/interfaces/api-error.interface.ts

export interface ApiErrorResponse {
  success: false;              // Always false for errors
  statusCode: number;          // HTTP status code
  error: string;               // Machine-readable error code (e.g., 'ACCOUNT_LOCKED')
  message: string;             // Human-readable message
  meta?: Record<string, any>;  // Contextual data (e.g., { lockoutMinutes: 30 })
  timestamp: string;           // ISO timestamp
  path: string;                // Request path
}
```

### Error Codes (Auth Module)

| Error Code | HTTP Status | When Thrown | Meta Fields |
|------------|-------------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password | `remainingAttempts?: number` |
| `ACCOUNT_LOCKED` | 401 | 5+ failed attempts | `lockoutMinutes: number` |
| `EMAIL_EXISTS` | 409 | Registration with existing email | - |
| `TOKEN_EXPIRED` | 401 | Expired refresh token | - |
| `TOKEN_REVOKED` | 401 | Already-used refresh token | - |
| `USER_NOT_FOUND` | 401 | Invalid user during refresh | - |
| `VALIDATION_ERROR` | 400 | class-validator failures | `errors: string[]` |

---

## 2. Backend Implementation Steps

### Current State Analysis

| Component | Current State | Target State |
|-----------|---------------|--------------|
| [http-exception.filter.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/common/filters/http-exception.filter.ts) | ✅ Registered, ❌ Wrong format | Delete (superseded) |
| [global-exception.filter.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/common/filters/global-exception.filter.ts) | ❌ Not registered, ✅ Correct format | Register globally |
| `BusinessException` | ✅ Exists in global-exception.filter.ts | Move to separate file |
| [auth.service.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/auth.service.ts) | Throws plain `UnauthorizedException` | Throw with error codes & meta |

---

### Step-by-Step Checklist

#### Step 3.1: Register `GlobalExceptionFilter`

##### [MODIFY] [main.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/main.ts)

Replace `HttpExceptionFilter` with `GlobalExceptionFilter`:

```diff
-import { HttpExceptionFilter } from './common/filters/http-exception.filter';
+import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// ...

-app.useGlobalFilters(new HttpExceptionFilter());
+app.useGlobalFilters(new GlobalExceptionFilter());
```

---

#### Step 3.2: Enhance `GlobalExceptionFilter` with Meta Support

##### [MODIFY] [global-exception.filter.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/common/filters/global-exception.filter.ts)

Update to extract `meta` from exceptions:

```typescript
// Enhanced HttpException handling (lines 49-64)
else if (exception instanceof HttpException) {
  status = exception.getStatus();
  const exceptionResponse = exception.getResponse();

  if (typeof exceptionResponse === 'object') {
    const res = exceptionResponse as any;
    message = Array.isArray(res.message)
      ? res.message.join(', ')
      : res.message || exception.message;
    errorCode = res.error || this.inferErrorCode(status);
    // NEW: Extract meta for contextual data
    meta = res.meta || null;
  } else {
    message = exceptionResponse as string;
  }
}

// Response with meta
response.status(status).json({
  success: false,
  data: null,
  error: errorCode,
  message,
  ...(meta && { meta }),  // NEW: Include meta if present
  timestamp: new Date().toISOString(),
  path: request.url,
});
```

---

#### Step 3.3: Create `AuthException` Classes

##### [NEW] [auth.exception.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/auth.exception.ts)

Create domain-specific exceptions for Auth:

```typescript
import { UnauthorizedException, ConflictException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(remainingAttempts?: number) {
    super({
      error: 'INVALID_CREDENTIALS',
      message: remainingAttempts !== undefined
        ? `Invalid credentials. ${remainingAttempts} attempts remaining.`
        : 'Invalid credentials',
      meta: remainingAttempts !== undefined ? { remainingAttempts } : undefined,
    });
  }
}

export class AccountLockedException extends UnauthorizedException {
  constructor(lockoutMinutes: number) {
    super({
      error: 'ACCOUNT_LOCKED',
      message: `Account is locked. Try again in ${lockoutMinutes} minutes.`,
      meta: { lockoutMinutes },
    });
  }
}

export class EmailExistsException extends ConflictException {
  constructor() {
    super({
      error: 'EMAIL_EXISTS',
      message: 'Email is already registered',
    });
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super({
      error: 'TOKEN_EXPIRED',
      message: 'Token has expired',
    });
  }
}

export class TokenRevokedException extends UnauthorizedException {
  constructor() {
    super({
      error: 'TOKEN_REVOKED',
      message: 'Token has been revoked',
    });
  }
}
```

---

#### Step 3.4: Update `AuthService` to Use New Exceptions

##### [MODIFY] [auth.service.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/auth.service.ts)

Replace plain exceptions with domain exceptions:

```diff
-import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
+import { Injectable } from '@nestjs/common';
+import {
+  InvalidCredentialsException,
+  AccountLockedException,
+  EmailExistsException,
+  TokenExpiredException,
+  TokenRevokedException,
+} from './auth.exception';

// Line 33-35: Registration email check
-throw new ConflictException('Email already registered');
+throw new EmailExistsException();

// Line 72-77: Account locked check
-throw new UnauthorizedException(
-  `Account is locked. Try again in ${minutesLeft} minutes.`
-);
+throw new AccountLockedException(minutesLeft);

// Line 79-81: Invalid user/inactive check
-throw new UnauthorizedException('Invalid credentials');
+throw new InvalidCredentialsException();

// Line 100: Wrong password - with remaining attempts
-throw new UnauthorizedException('Invalid credentials');
+const remainingAttempts = 5 - newFailedCount;
+throw new InvalidCredentialsException(remainingAttempts > 0 ? remainingAttempts : undefined);

// Line 163: Token revoked
-throw new UnauthorizedException('Token has been revoked');
+throw new TokenRevokedException();

// Line 194: Invalid refresh token
-throw new UnauthorizedException('Invalid refresh token');
+throw new TokenExpiredException();
```

---

#### Step 3.5: Optional Cleanup

##### [DELETE] [http-exception.filter.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/common/filters/http-exception.filter.ts)

This file is superseded by `GlobalExceptionFilter` and can be safely deleted.

---

## 3. Frontend Update Requirements

### Current Frontend Error Handling

```typescript
// auth-store.ts (lines 88-114)
const err = error as {
  response?: {
    data?: {
      message?: string;
      error?: string;        // ✅ Already expecting this
      lockoutMinutes?: number;      // ❌ Should be in meta
      remainingAttempts?: number;   // ❌ Should be in meta
    }
  }
};
```

### Required Changes

##### [MODIFY] [auth-store.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/stores/auth-store.ts)

Update error type definition:

```diff
const err = error as {
  response?: {
    data?: {
      message?: string;
      error?: string;
-     lockoutMinutes?: number;
-     remainingAttempts?: number;
+     meta?: {
+       lockoutMinutes?: number;
+       remainingAttempts?: number;
+     };
    }
  }
};

// Update switch statement access
switch (errorData?.error) {
  case 'ACCOUNT_LOCKED':
-   message = `Account is locked. Please try again in ${errorData.lockoutMinutes || 30} minutes.`;
+   message = `Account is locked. Please try again in ${errorData.meta?.lockoutMinutes || 30} minutes.`;
    break;
  case 'INVALID_CREDENTIALS':
-   if (errorData.remainingAttempts !== undefined) {
-     message = `Invalid credentials. ${errorData.remainingAttempts} attempts remaining.`;
+   if (errorData.meta?.remainingAttempts !== undefined) {
+     message = `Invalid credentials. ${errorData.meta.remainingAttempts} attempts remaining.`;
    }
    break;
  // ...
}
```

---

## 4. Verification Plan

### 4.1 Automated Tests

Existing tests in [auth.service.spec.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/auth.service.spec.ts) already cover:

- ✅ AUTH-001: Login success flow
- ✅ AUTH-002: Wrong password increments failedLoginCount  
- ✅ AUTH-003: Non-existent email throws UnauthorizedException
- ✅ AUTH-004: Account lockout after 5 attempts
- ✅ AUTH-005: Login while locked throws error with minutes

**Run existing tests:**
```powershell
cd c:\Users\User\Desktop\rga-dashboard-main\backend
npm test -- --testPathPattern=auth.service.spec.ts
```

> [!NOTE]
> Tests will need minor updates to check for new exception types (`InvalidCredentialsException`, `AccountLockedException`).

### 4.2 New E2E Test (Recommended)

##### [NEW] [auth.e2e-spec.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/test/auth.e2e-spec.ts)

Create E2E test to verify actual HTTP response format:

```typescript
describe('Auth Error Responses (e2e)', () => {
  it('should return structured error for invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrong' })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: expect.any(String),
    });
  });
});
```

**Run E2E tests:**
```powershell
cd c:\Users\User\Desktop\rga-dashboard-main\backend
npm run test:e2e -- --testPathPattern=auth.e2e-spec.ts
```

### 4.3 Manual Verification

1. **Start Backend:**
   ```powershell
   cd c:\Users\User\Desktop\rga-dashboard-main\backend
   npm run start:dev
   ```

2. **Test Invalid Login via cURL:**
   ```powershell
   curl -X POST http://localhost:3000/api/v1/auth/login `
     -H "Content-Type: application/json" `
     -d '{"email":"test@invalid.com","password":"wrong"}'
   ```

   **Expected Response:**
   ```json
   {
     "success": false,
     "data": null,
     "error": "INVALID_CREDENTIALS",
     "message": "Invalid credentials",
     "timestamp": "2026-01-20T...",
     "path": "/api/v1/auth/login"
   }
   ```

3. **Verify in Browser (Frontend):**
   - Attempt login with wrong credentials
   - Open DevTools → Network → Check response body structure
   - UI should display user-friendly error message

---

## 5. Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `backend/src/main.ts` | Register `GlobalExceptionFilter` |
| MODIFY | `backend/src/common/filters/global-exception.filter.ts` | Add `meta` support |
| NEW | `backend/src/modules/auth/auth.exception.ts` | Domain exceptions |
| MODIFY | `backend/src/modules/auth/auth.service.ts` | Use new exceptions |
| MODIFY | `frontend/src/stores/auth-store.ts` | Access `meta.*` fields |
| DELETE | `backend/src/common/filters/http-exception.filter.ts` | Superseded |
| MODIFY | `backend/src/modules/auth/auth.service.spec.ts` | Update test expectations |

---

## 6. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing API consumers | Schema is additive (`meta` is optional); existing fields preserved |
| Test failures | Update test expectations before merging |
| Frontend crash if `meta` undefined | Use optional chaining (`meta?.lockoutMinutes`) |

---

## Approval Required

Please review this plan and approve before proceeding to Step 3 (Implementation).
