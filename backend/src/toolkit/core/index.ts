/**
 * =============================================================================
 * Core Module - Public API
 * =============================================================================
 * 
 * This is the ONLY file that should be imported from outside the core module.
 * All internal implementations are hidden behind these exports.
 * =============================================================================
 */

// Contracts (Interfaces & Types)
export * from './contracts';

// Configuration
export { loadConfiguration, ConfigurationError } from './configuration';

// Execution Context
export { ExecutionContextFactory } from './execution-context';

// Dependency Injection
export { TOKENS, ServiceLocator, initializeContainer, disposeContainer } from './container';

// Command Registry
export { CommandRegistry } from './command-registry';

// Safety Execution Wrapper
export { executeWithSafetyManifest, shouldUseManifestSafety } from './safety-execution';

// Preflight
export { runToolkitPreflight } from './preflight';
