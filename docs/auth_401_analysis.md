# Auth 401 Root Cause Analysis Report

## Executive Summary

**Status**: ✅ **CODE IS CORRECT** - No payload mismatches or interceptor issues found.

The 401 Unauthorized error is **NOT caused by a code bug**. Both frontend and backend are correctly aligned. The issue is most likely a **runtime/data layer problem**.

---

## Task 1: Code Audit Results

### 1.1 API Client Analysis ([api-client.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/services/api-client.ts))

| Aspect | Status | Finding |
|--------|--------|---------|
| Base URL | ✅ | `http://localhost:3000/api/v1` (matches backend prefix) |
| Content-Type | ✅ | `'Content-Type': 'application/json'` (JSON payload) |
| Request Interceptor | ✅ | Attaches `Bearer` token only (no rogue headers) |
| Response Interceptor | ✅ | Auto-unwraps `{ success, data }` - correct |
| CORS | ✅ | No credentials manipulation |

### 1.2 Login Service Analysis ([auth-store.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/stores/auth-store.ts))

```typescript
// Line 67-70: Payload sent to backend
const response = await apiClient.post('/auth/login', {
    email,    // ✅ Matches backend DTO field
    password, // ✅ Matches backend DTO field
});
```

**Verdict**: Payload structure is correct (`{ email, password }`).

### 1.3 Login Form Analysis ([Login.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/pages/Login.tsx))

| Aspect | Status | Finding |
|--------|--------|---------|
| Form submission | ✅ | [handleSubmit](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/pages/Login.tsx#35-65) calls [login(email, password)](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/auth.service.ts#58-149) |
| Input types | ✅ | `type="email"` and `type="password"` |
| Event handling | ✅ | `e.preventDefault()` blocks page reload |

---

## Task 2: Backend Comparison

### 2.1 LoginDto ([login.dto.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/dto/login.dto.ts))

```typescript
export class LoginDto {
    @IsEmail()
    email: string;     // ✅ Frontend sends "email"

    @IsString()
    password: string;  // ✅ Frontend sends "password"
}
```

### 2.2 Auth Service Logic ([auth.service.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/auth/auth.service.ts))

The backend login flow checks:
1. **User exists** via `findFirst({ where: { email } })` - Line 66
2. **Account not locked** - Line 72-77
3. **User is active** (`isActive: true`) - Line 79-81
4. **Password matches** via `bcrypt.compare()` - Line 83

Any failure at these points throws `UnauthorizedException` → **401**.

---

## Root Cause Analysis

Since the code is correct, the 401 must come from one of these **runtime conditions**:

| # | Likely Cause | How to Verify |
|---|--------------|---------------|
| 1 | **No user in database** | Run `npx prisma db seed` or check DB |
| 2 | **Wrong password** | Try default: `password123` |
| 3 | **Account locked** | Check `lockedUntil > NOW()` in User table |
| 4 | **User inactive** | Check `isActive = false` in User table |
| 5 | **CORS blocking preflight** | Check browser DevTools → Network → check for 403/blocked OPTIONS |

---

## Verification Steps (Without Reloading App)

### Step 1: Check Backend Logs
```powershell
# In backend terminal, look for validation errors
# If payload structure was wrong, NestJS would log:
# "Bad Request Exception: [validation errors]"
```

### Step 2: Test API Directly with cURL
```powershell
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

**Expected Success Response**:
```json
{
  "user": { "id": "...", "email": "...", "firstName": "...", "role": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**If 401 from cURL**:
- The issue is **database seeding** (no user exists)
- Or wrong password

### Step 3: Seed the Database
```powershell
cd c:\Users\User\Desktop\rga-dashboard-main\backend
npx prisma db seed
```

### Step 4: Check Account Lock Status
```sql
-- In your database client
SELECT id, email, "isActive", "lockedUntil", "failedLoginCount"
FROM "User"
WHERE email = 'admin@example.com';
```

---

## Fix Plan

**IF** the issue is confirmed as "no user in database":

```powershell
# Fix: Seed the database
cd c:\Users\User\Desktop\rga-dashboard-main\backend
npx prisma migrate deploy
npx prisma db seed
```

**IF** the account is locked:

```sql
-- Unlock the account manually
UPDATE "User"
SET "lockedUntil" = NULL, "failedLoginCount" = 0
WHERE email = 'admin@example.com';
```

---

## Conclusion

| Finding | Status |
|---------|--------|
| Payload field names (`email`, `password`) | ✅ Matching |
| Content-Type header | ✅ JSON |
| No rogue interceptors | ✅ Confirmed |
| Base URL alignment | ✅ `/api/v1/auth/login` |

**The code has no bugs.** The 401 is caused by runtime data:
1. **Most likely**: Database not seeded (no user exists)
2. **Second likely**: Account locked from previous failed attempts

**Next Action**: Test with cURL and verify database user exists.
