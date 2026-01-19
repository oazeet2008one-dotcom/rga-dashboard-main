# Integration API Specification

> **Generated:** 2026-01-19  
> **Purpose:** Frontend UI development for Data Sources (Connect/Disconnect/View Status)  
> **Backend:** NestJS + Prisma + PostgreSQL

---

## Table of Contents

1. [Overview](#overview)
2. [Common Patterns](#common-patterns)
3. [Google Ads](#google-ads)
4. [Facebook Ads](#facebook-ads)
5. [TikTok Ads](#tiktok-ads)
6. [LINE Ads](#line-ads) *(Bonus)*
7. [Status Enums & Types](#status-enums--types)
8. [Known Issues & Gaps](#known-issues--gaps)

---

## Overview

All integrations follow a **3-step OAuth flow** pattern defined in `oauth-provider.interface.ts`:

```
1. GET /auth/{platform}/url      → Returns OAuth URL for redirect
2. GET /auth/{platform}/callback → Handles OAuth callback, returns tempToken
3. GET /temp-accounts            → Returns available accounts to select
4. POST /complete                → Saves selected account to database
```

**Authentication:** All endpoints (except `/callback`) require JWT Bearer token via `JwtAuthGuard`.

---

## Common Patterns

### OAuth Flow Interface

```typescript
// File: modules/integrations/common/oauth-provider.interface.ts

interface OAuthCallbackResult {
  status: 'select_account' | 'success';
  accounts?: OAuthAccount[];
  tempToken?: string;
  accountId?: string;
}

interface OAuthAccount {
  id: string;
  name: string;
  status?: string;
  type?: string;
}

interface OAuthConnectionResult {
  success: boolean;
  accountId: string;
  accountName?: string;
}
```

### Standard Response Structures

**Status Response:**
```json
{
  "isConnected": true,
  "accounts": [
    {
      "id": "uuid",
      "customerId": "123456789",
      "accountName": "My Account",
      "status": "ENABLED",
      "lastSyncAt": "2026-01-19T00:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Disconnect Response:**
```json
{
  "success": true,
  "message": "Platform disconnected successfully"
}
```

---

## Google Ads

### Controllers

| Controller | Route Prefix | Description |
|------------|--------------|-------------|
| `GoogleAdsAuthController` | `/auth/google/ads` | OAuth flow endpoints |
| `GoogleAdsIntegrationController` | `/integrations/google-ads` | Status & management |

### Endpoints

#### Auth Controller (`/auth/google/ads`)

| Method | Endpoint | Auth | Description | Request | Response |
|--------|----------|------|-------------|---------|----------|
| `GET` | `/url` | ✅ JWT | Get OAuth authorization URL | - | `{ authUrl: string, message: string }` |
| `GET` | `/callback` | ❌ | OAuth callback (redirects to frontend) | `?code=...&state=...` | Redirect: `/integrations?status=...&tempToken=...&platform=ads` |
| `GET` | `/temp-accounts` | ✅ JWT | Get accounts for selection | `?tempToken=...` | Account list |
| `POST` | `/complete` | ✅ JWT | Complete connection | `{ tempToken, customerId }` | `{ success, accountId, accountName }` |
| `GET` | `/accounts` | ✅ JWT | Get connected accounts | - | `{ accounts: GoogleAdsAccount[] }` |

#### Integration Controller (`/integrations/google-ads`)

| Method | Endpoint | Auth | Description | Request | Response |
|--------|----------|------|-------------|---------|----------|
| `GET` | `/status` | ✅ JWT | Check connection status | - | `{ isConnected: boolean, accounts: [] }` |
| `GET` | `/auth-url` | ✅ JWT | Get OAuth URL (duplicate) | - | `{ url: string }` |
| `POST` | `/oauth/callback` | ✅ JWT | Handle callback (API mode) | `{ code, state }` | Callback result |
| `GET` | `/temp-accounts` | ✅ JWT | Get temp accounts | `?tempToken=...` | Account list |
| `POST` | `/connect` | ✅ JWT | Connect account | `{ tempToken, customerId }` | Connection result |
| `GET` | `/accounts` | ✅ JWT | Get connected accounts | - | Account list |
| `DELETE` | `/` | ✅ JWT | Disconnect integration | - | `{ success, message }` |
| `POST` | `/sync` | ✅ JWT | Trigger manual sync | - | `{ success, message, results }` |

### Auth Flow Note

> **Two-Phase OAuth:** User is redirected to Google, backend handles token exchange. On callback, frontend receives `tempToken` and `platform=ads` query params. Frontend then calls `/temp-accounts` to show account picker, followed by `/complete` with selected `customerId`.

---

## Facebook Ads

### Controllers

| Controller | Route Prefix | Description |
|------------|--------------|-------------|
| `FacebookAdsAuthController` | `/auth/facebook/ads` | OAuth flow endpoints |
| `FacebookAdsIntegrationController` | `/integrations/facebook-ads` | Status & management |

### Endpoints

#### Auth Controller (`/auth/facebook/ads`)

| Method | Endpoint | Auth | Description | Request | Response |
|--------|----------|------|-------------|---------|----------|
| `GET` | `/url` | ✅ JWT | Get OAuth authorization URL | - | `{ authUrl: string, message: string }` |
| `GET` | `/callback` | ❌ | OAuth callback (redirects to frontend) | `?code=...&state=...` | Redirect: `/integrations?status=...&tempToken=...&platform=facebook` |
| `GET` | `/temp-accounts` | ✅ JWT | Get accounts for selection | `?tempToken=...` | Account list |
| `POST` | `/complete` | ✅ JWT | Complete connection | `{ tempToken, accountId }` | `FacebookAdsAccount` object |
| `GET` | `/accounts` | ✅ JWT | Get connected accounts | - | `FacebookAdsAccount[]` |

#### Integration Controller (`/integrations/facebook-ads`)

| Method | Endpoint | Auth | Description | Request | Response |
|--------|----------|------|-------------|---------|----------|
| `GET` | `/status` | ✅ JWT | Check connection status | - | `IntegrationStatusResponse` |
| `GET` | `/accounts` | ✅ JWT | Get connected accounts | - | `{ accounts: [] }` |
| `DELETE` | `/` | ✅ JWT | Disconnect integration | - | `{ success, message }` |

### Auth Flow Note

> **Similar to Google:** Uses Facebook Graph API v18.0. Short-lived token is exchanged for long-lived token automatically. Scopes requested: `ads_management`, `ads_read`, `read_insights`.

---

## TikTok Ads

### Controllers

| Controller | Route Prefix | Description |
|------------|--------------|-------------|
| `TikTokAdsController` | `/auth/tiktok` | OAuth flow + account management |
| `TikTokAdsIntegrationController` | `/integrations/tiktok-ads` | Status & disconnect |

### Endpoints

#### Auth Controller (`/auth/tiktok`)

| Method | Endpoint | Auth | Description | Request | Response |
|--------|----------|------|-------------|---------|----------|
| `GET` | `/url` | ✅ JWT | Get OAuth URL or sandbox info | - | See response schema below |
| `GET` | `/callback` | ❌ | OAuth callback | `?code=...&state=...` | Redirect to frontend |
| `GET` | `/temp-accounts` | ✅ JWT | Get accounts for selection | `?tempToken=...` | `{ success, accounts, count }` |
| `POST` | `/complete` | ✅ JWT | Complete connection | `{ tempToken, advertiserId }` | `{ success, accountId, accountName }` |
| `POST` | `/connect-sandbox` | ✅ JWT | Connect sandbox (dev only) | - | `{ success, accountId, accountName }` |
| `GET` | `/accounts` | ✅ JWT | Get connected accounts | - | `{ success, accounts, count }` |
| `DELETE` | `/disconnect` | ✅ JWT | Disconnect all accounts | - | `{ success, message }` |
| `POST` | `/refresh-token` | ✅ JWT | Manual token refresh | `{ accountId }` | `{ success, message }` |

**GET `/url` Response Schema:**
```typescript
// Production mode
{ isSandbox: false, url: string, message: string }

// Sandbox mode
{ isSandbox: true, message: string, connectEndpoint: '/auth/tiktok/connect-sandbox' }
```

#### Integration Controller (`/integrations/tiktok-ads`)

| Method | Endpoint | Auth | Description | Request | Response |
|--------|----------|------|-------------|---------|----------|
| `GET` | `/status` | ✅ JWT | Check connection status | - | `{ isConnected: boolean, accounts: [] }` |
| `DELETE` | `/` | ✅ JWT | Disconnect integration | - | `{ success, message }` |

### Auth Flow Note

> **Sandbox Support:** TikTok integration supports sandbox mode via `TIKTOK_USE_SANDBOX=true` env var. In sandbox, frontend should call `/connect-sandbox` instead of OAuth flow. The `/url` endpoint will indicate sandbox mode in response.

---

## LINE Ads

### Controllers

| Controller | Route Prefix | Description |
|------------|--------------|-------------|
| `LineAdsIntegrationController` | `/integrations/line-ads` | Status & management |
| ❌ **MISSING** | `/auth/line/ads` | Auth controller not implemented |

### Endpoints

#### Integration Controller (`/integrations/line-ads`)

| Method | Endpoint | Auth | Description | Request | Response |
|--------|----------|------|-------------|---------|----------|
| `GET` | `/status` | ✅ JWT | Check connection status | - | `{ isConnected: boolean, accounts: [] }` |
| `GET` | `/accounts` | ✅ JWT | Get connected accounts | - | `{ accounts: [] }` |
| `DELETE` | `/` | ✅ JWT | Disconnect integration | - | `{ success, message }` |

### ⚠️ Missing Endpoints

OAuth flow endpoints are not implemented for LINE Ads.

---

## Status Enums & Types

### OAuth Callback Status

```typescript
type OAuthCallbackStatus = 'select_account' | 'success';
```

| Value | Description |
|-------|-------------|
| `select_account` | Multiple accounts found, user must select one |
| `success` | Single account or direct connection completed |

### Account Status (Database)

Stored as plain `String` in database, **not a Prisma enum**.

| Platform | Field | Default | Common Values |
|----------|-------|---------|---------------|
| Google Ads | `status` | `'ENABLED'` | `ENABLED`, `PAUSED`, `REMOVED` |
| Facebook Ads | `status` | `'ACTIVE'` | `ACTIVE`, `DISABLED` |
| TikTok Ads | `status` | `'ACTIVE'` | `ACTIVE`, `DISABLED` |
| LINE Ads | `status` | `'ACTIVE'` | `ACTIVE`, `DISABLED` |

### Database Models

| Model | Primary ID Field | Account Identifier |
|-------|-----------------|-------------------|
| `GoogleAdsAccount` | `customerId` | Google Customer ID |
| `FacebookAdsAccount` | `accountId` | Account ID (act_xxx) |
| `TikTokAdsAccount` | `advertiserId` | TikTok Advertiser ID |
| `LineAdsAccount` | `channelId` | LINE Channel ID |

---

## Known Issues & Gaps

### ✅ Resolved Issues (2026-01-19)

| Platform | Issue | Resolution |
|----------|-------|------------|
| **Facebook Ads** | Missing `/integrations/facebook-ads/status` endpoint | ✅ Created `FacebookAdsIntegrationController` |
| **Facebook Ads** | Missing `DELETE /integrations/facebook-ads` (disconnect) | ✅ Implemented |
| **Facebook Ads** | `disconnect()` method not in OAuth service | ✅ Added to `FacebookAdsOAuthService` |
| **All Platforms** | Inconsistent status response format | ✅ Standardized to `IntegrationStatusResponse` |

### Remaining Inconsistencies

| Issue | Details |
|-------|---------|
| **Route Prefix Inconsistency** | Google uses `/auth/google/ads`, TikTok uses `/auth/tiktok` (no `/ads` suffix) |
| **Disconnect Route** | TikTok auth uses `/disconnect`, integration uses `/` (DELETE root) |
| **Complete Payload** | Google: `customerId`, Facebook: `accountId`, TikTok: `advertiserId` |

### Standardized Response Format

All `/status` endpoints now return:
```typescript
interface IntegrationStatusResponse {
  isConnected: boolean;
  lastSyncAt: Date | null;
  accounts: Array<{
    id: string;          // Internal DB ID
    externalId: string;  // Platform ID (customerId, accountId, advertiserId)
    name: string;        // Account display name
    status: string;      // ACTIVE, ENABLED, etc.
  }>;
}
```

---

## Quick Reference for Frontend

### Recommended Frontend Service Structure

```typescript
interface IntegrationPlatform {
  // OAuth Flow
  getAuthUrl(): Promise<{ url: string }>;
  
  // After OAuth (using tempToken from redirect)
  getTempAccounts(tempToken: string): Promise<Account[]>;
  completeConnection(tempToken: string, accountId: string): Promise<void>;
  
  // Management
  getStatus(): Promise<IntegrationStatusResponse>;
  getAccounts(): Promise<Account[]>;
  disconnect(): Promise<void>;
}
```

### Endpoint Mapping by Platform

| Action | Google Ads | Facebook Ads | TikTok Ads |
|--------|------------|--------------|------------|
| Get OAuth URL | `GET /auth/google/ads/url` | `GET /auth/facebook/ads/url` | `GET /auth/tiktok/url` |
| Status | `GET /integrations/google-ads/status` | `GET /integrations/facebook-ads/status` | `GET /integrations/tiktok-ads/status` |
| Disconnect | `DELETE /integrations/google-ads` | `DELETE /integrations/facebook-ads` | `DELETE /integrations/tiktok-ads` |
| Accounts | `GET /auth/google/ads/accounts` | `GET /auth/facebook/ads/accounts` | `GET /auth/tiktok/accounts` |

