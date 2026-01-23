# Implementation Plan - Integration Hardening & Mock Data Switch

## Goal
Implement a "Smart Switch" layer that routes data requests to Real APIs (FB/Google) or Mock Data based on user context (Demo vs Live), ensuring system stability and graceful error handling.

## Proposed Changes

### Backend

#### [NEW] `backend/src/modules/data-sources/integration-switch.service.ts`
-   Create `IntegrationSwitchService`.
-   Implement `fetchCampaigns(user: User, dateRange: DateRange)`:
    -   Check `prisma.integration` (or account tables) for user/tenant.
    -   If no active integration or `demo_user` flag -> Call `MockDataService.getCampaigns()`.
    -   Else -> Call `UnifiedSyncService / Adapters` or query real data from DB (depending on architecture).
    -   Log telemetry (Mock vs Real).
-   **Note**: Will assume `MockDataService` needs to be imported. If it doesn't exist, I will use [DashboardService](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/dashboard/dashboard.service.ts#37-699)'s mock data logic or creating a simple provider. Given the "Current State" in prompt says we HAVE `MockDataService`, I will assume I can import it from `../mock-data/mock-data.service` or similar. *Correction*: Search found nothing. I will create a basic `MockDataService` interface/stub if needed or repurpose `MockDataSeederService` if appropriate, but likely better to assume it needs to be created. Providing it in the output is not requested but I might need it for compilation. I will add it to the output if I create it.

#### [NEW] `backend/src/modules/integrations/common/integration-error.handler.ts`
-   Create `IntegrationErrorHandler` class.
-   Implement `handleError<T>(operation: () => Promise<T>, fallbackValue: T): Promise<T>`.
-   Logic:
    -   Try/Catch block.
    -   `TokenExpiredError` -> Mark integration `NEEDS_RECONNECT`, return fallback.
    -   Log errors.
    -   Do not throw 500 for external API failures.

#### [MODIFY] [backend/src/modules/dashboard/dashboard.controller.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/dashboard/dashboard.controller.ts)
-   Refactor [getOverview](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/dashboard/dashboard.service.ts#533-698) (and potentially [getTopCampaigns](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/dashboard/dashboard.controller.ts#73-90) if mapped to `fetchCampaigns`) to use `IntegrationSwitchService`.
-   Inject `IntegrationSwitchService`.
-   Return `isDemo` flag in response to trigger Frontend Banner.

#### [NEW] `backend/src/modules/mock-data/mock-data.service.ts` (Implicit Requirement)
-   Create this service if it doesn't exist to satisfy the `IntegrationSwitchService` dependency.
-   Implement `getCampaigns` to return simulated data.

### Frontend

#### [NEW] `frontend/src/components/dashboard/DemoBanner.tsx`
-   Create `DemoBanner` component.
-   Render simple alert/banner if `isDemo` prop is true.

## Verification Plan

### Automated Tests
-   Since I cannot run backend tests easily without setup, I will rely on compilation and manual verification steps.

### Manual Verification
1.  **Demo Mode**:
    -   Log in as a user with NO connected integrations.
    -   Access Dashboard.
    -   Verify `DemoBanner` is visible.
    -   Verify data is shown (Mock Data).
2.  **Live Mode**:
    -   Log in as a user WITH connected integrations (if possible to simulate).
    -   Verify `DemoBanner` is NOT visible.
3.  **Graceful Failure**:
    -   (Hard to test without mocking API failure) - Code review `IntegrationErrorHandler` logic.
