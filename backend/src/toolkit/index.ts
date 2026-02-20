/**
 * =============================================================================
 * RGA Toolkit - Public API
 * =============================================================================
 * 
 * This is the main entry point for the toolkit module.
 * Use this for programmatic access to toolkit features.
 * 
 * For CLI usage, use:
 *   npm run dev:toolkit
 * =============================================================================
 */

// Core (Contracts, DI, Configuration)
export * from './core';

// Infrastructure (Implementations)
export * from './infrastructure';


// Scheduling Semantics (Phase 2.3.2)
export * from './schedule';

// Execution History (Phase 2.3.3)
export * from './history';

// Schedule Provider (Phase 2.4.1)
export * from './schedules';

// Scheduler Runner (Phase 2.4.2)
export * from './runner';

// Simulation (Developer Toolkit Only)
export * from './simulation';

// Utilities
export { AdSimulatorEngine } from './ad-simulator.engine';
export { ToolkitAuthService } from './toolkit-auth.service';
export { BackendApiClient } from './backend-api.client';

/**
 * Semantic Version
 */
export const TOOLKIT_VERSION = '2.0.0';
