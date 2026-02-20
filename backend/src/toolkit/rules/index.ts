/**
 * =============================================================================
 * Rules Module - Public API
 * =============================================================================
 *
 * Alert Rule Management exports.
 *
 * Usage:
 * ```typescript
 * import { AlertRule, createAlertRule, RuleValidator, FixtureRuleSource } from './rules';
 * ```
 * =============================================================================
 */

// Domain Model
export {
    AlertRule,
    AlertSeverity,
    RuleScope,
    createAlertRule,
    compareSeverity,
    isSeverityAtLeast,
    SEVERITY_PRIORITY,
} from './alert-rule.model';

// Validation (use RuleValidationError to avoid conflict with core ValidationError)
export {
    RuleValidator,
    RuleValidationError,
    ValidationResult,
    ruleValidator,
} from './rule-validator';

// Rule Sources
export {
    IRuleSource,
    FixtureRuleSource,
} from './rule-source.fixture';

export {
    InMemoryRuleSource,
    createRuleSource,
    createEmptyRuleSource,
} from './rule-source.memory';

// Adapter
export {
    RuleSourceAdapter,
    adaptRuleSource,
} from './rule-source.adapter';
