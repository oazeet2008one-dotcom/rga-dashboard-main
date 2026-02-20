/**
 * =============================================================================
 * Toolkit Services - Business Logic Layer
 * =============================================================================
 * 
 * Services contain pure business logic, separated from:
 * - Commands (user intent)
 * - Handlers (orchestration)
 * - Infrastructure (persistence, logging)
 * 
 * This separation enables:
 * - Unit testing without mocks
 * - Reuse across different interfaces (CLI, API, Queue workers)
 * - Clear dependency boundaries
 * =============================================================================
 */

export {
    GoogleAdsSeederService,
    SeederConfig,
    SeederResult,
    IProgressReporter,
    NoOpProgressReporter,
} from './google-ads-seeder.service';

export {
    AlertEngine,
    MetricSnapshot,
    // AlertRule is now in rules/alert-rule.model.ts
    AlertCondition,
    AlertTriggerResult,
    AlertEvaluationResult,
    AlertCheckConfig,
    AlertCheckResult,
} from './alert-engine.service';

export {
    AlertScenarioService,
    AlertScenarioConfig,
    AnomalyConfig,
    AlertScenarioResult,
} from './alert-scenario.service';

export {
    TenantResetService,
    ResetMode,
    ResetConfirmation,
    ResetResult,
} from './tenant-reset.service';
