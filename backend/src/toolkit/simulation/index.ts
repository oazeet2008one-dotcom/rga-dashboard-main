/**
 * =============================================================================
 * Simulation Module - Provider & Fixture System
 * =============================================================================
 *
 * Provides deterministic, mockable data sources for alert testing.
 *
 * This module is for DEVELOPER TOOLKIT USE ONLY.
 * Not for production backends.
 * =============================================================================
 */

// Simulation Context
export {
    SimulationContext,
    SimulationMode,
    createSimulationContext,
    createPredefinedScenarioContext,
    PREDEFINED_SCENARIOS,
    PredefinedScenarioName,
} from './simulation-context';

// Mock Providers
export { MockRuleProvider, DEFAULT_RULES } from './mock-rule.provider';
export { MockMetricProvider } from './mock-metric.provider';
