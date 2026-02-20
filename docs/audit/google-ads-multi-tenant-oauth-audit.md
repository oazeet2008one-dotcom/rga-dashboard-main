# Google Ads API Authentication and Multi-tenant OAuth Audit

## 1. Files & Schemas Audited
- `backend/prisma/schema.prisma` (Models: `Tenant`, `GoogleAdsAccount`, `Integration`)
- `backend/src/modules/integrations/google-ads/services/google-ads-api.service.ts`
- `backend/src/modules/integrations/google-ads/services/google-ads-client.service.ts`
- `backend/src/modules/integrations/google-ads/google-ads-oauth.service.ts`
- `backend/.env.example`

## 2. Current Architecture & Data Flow
- **Client Request to OAuth**: Client initiates OAuth via `GoogleAdsOAuthService.generateAuthUrl`.
- **OAuth Callback**: System receives `code` and exchanges it for `access_token` and `refresh_token`. The system caches these temporarily and lists all accessible Google Ads accounts (using Option B: flattening all accessible accounts).
- **Connection Completion**: The user selects an account (`customerId`). `GoogleAdsOAuthService.completeConnection` saves the `customerId` and the encrypted `refreshToken` into the `GoogleAdsAccount` table tied to the `tenantId`.
- **API Requests**: When `GoogleAdsApiService` fetches campaigns or metrics, it delegates to `GoogleAdsClientService.getCustomer(customerId, decryptedRefreshToken)`.
- **Impersonation Pattern**: The `getCustomer` method forcefully injects `GOOGLE_ADS_LOGIN_CUSTOMER_ID` from the environment variables (System MCC) as the `login_customer_id` for **every** Google APIs request. 

## 3. Database Schema Gaps
- **Missing `loginCustomerId` Column**: `GoogleAdsAccount` schema currently maps a single `customerId` to a `refreshToken`. However, in a True Multi-tenant SaaS where Tenants bring their own Google accounts, each Tenant might be authenticating as a different Manager (MCC) or directly as an End-Advertiser without any Manager.
- **Over-reliance on Global Config**: The schema assumes all API interactions can be authenticated using the system's global MCC ID, making it impossible to support completely isolated Tenant Google Ads authentication that doesn't share the platform's central MCC.
- **OAuth App Isolation**: Currently `Integration` config supports custom credentials, but the Google Ads module uses global `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Without an isolated OAuth configuration in `Integration` or `GoogleAdsAccount`, 100% decoupling is hard.

## 4. Multi-tenant Blockers (Code Level)
- **Hardcoded MCC ID for Requests**:
  - In `google-ads-api.service.ts` and `google-ads-client.service.ts`, the line `const mccLoginCustomerId = this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');` is a Critical Blocker.
  - The API call enforces: `login_customer_id: mccLoginCustomerId || customerId`. If the tenant's token is not associated with the system's MCC, this causes an immediate `invalid_grant` or `USER_PERMISSION_DENIED`.
- **Hardcoded MCC ID in Account Listing**:
  - `getAllSelectableAccounts` also uses `login_customer_id: mccLoginCustomerId`. If the user logging in is from an external Tenant completely unrelated to the platform's MCC, their account won't even be readable because the API request forces the system's MCC ID into the header.

## 5. Security & Technical Debt Risks
- **Data Cross-Pollination Risk**: Passing the global MCC `login_customer_id` for a Tenant's own `refreshToken` means the system is structurally marrying the Tenant tokens with the Platform MCC, violating the 100% data separation requirement of Scenario B SaaS.
- **Single Point of Failure**: The global `GOOGLE_ADS_DEVELOPER_TOKEN` and `GOOGLE_ADS_LOGIN_CUSTOMER_ID` become SPOFs. If the Platform MCC hits rate limits, all Tenants are affected.
- **Token Decrypting & Error Handling**: While tokens are correctly encrypted in the DB, any failure in API (often due to MCC ID mismatch) throws an `invalid_grant`, leading the users to constantly reconnect their accounts unnecessarily. 
- **Temp Token Caching**: `handleCallback` uses a UUID `tempToken` in cache. This is reasonable, but the tokens remain in memory for 10 minutes. If compromised, it exposes `refreshToken`.
