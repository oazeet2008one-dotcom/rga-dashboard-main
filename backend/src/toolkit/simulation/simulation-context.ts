/**
 * =============================================================================
 * Simulation Context
 * =============================================================================
 *
 * Defines the context for a deterministic simulation run.
 * All mock providers require this context to ensure:
 * - Deterministic output
 * - Tenant isolation
 * - Scenario reproducibility
 *
 * Design Principles:
 * - Immutable (frozen after creation)
 * - Explicit (all inputs required)
 * - Serializable (can be logged/replayed)
 * =============================================================================
 */

/**
 * Simulation mode determines data source behavior
 */
export type SimulationMode = 'FIXTURE' | 'GENERATED' | 'HYBRID';

/**
 * Context for a deterministic simulation run
 */
export interface SimulationContext {
    /**
     * Tenant identifier - scope for all data
     */
    readonly tenantId: string;

    /**
     * Simulation scenario name
     * Used to locate fixture files
     */
    readonly scenarioName: string;

    /**
     * Date range for metric evaluation
     */
    readonly dateRange: {
        readonly start: Date;
        readonly end: Date;
    };

    /**
     * Data source mode
     * - FIXTURE: Load from JSON files only
     * - GENERATED: Use deterministic generators
     * - HYBRID: Fixtures + generated fallbacks
     */
    readonly mode: SimulationMode;

    /**
     * Base path for fixture resolution
     * Default: './fixtures'
     */
    readonly fixtureBasePath?: string;

    /**
     * Optional seed for deterministic generation
     * Same seed = same generated data
     */
    readonly seed?: string;

    /**
     * Optional overrides for specific metrics
     * Merges with fixture/generated data
     */
    readonly metricOverrides?: Record<string, number>;

    /**
     * Correlation ID for tracing
     */
    readonly correlationId: string;

    /**
     * Human-readable description
     */
    readonly description?: string;
}

/**
 * Factory for creating frozen SimulationContext
 */
export function createSimulationContext(
    params: Omit<SimulationContext, 'correlationId'> & { correlationId?: string }
): SimulationContext {
    const context: SimulationContext = {
        ...params,
        correlationId: params.correlationId ?? `sim-${Date.now()}-${params.scenarioName}`,
        fixtureBasePath: params.fixtureBasePath ?? './fixtures',
    };

    // Freeze to prevent accidental mutation
    return Object.freeze(context);
}

/**
 * Pre-defined simulation scenarios for common cases
 */
export const PREDEFINED_SCENARIOS = {
    'drop-spend': {
        description: 'Campaign with significant spend drop from baseline',
        defaultDateRange: { days: 1 },
    },
    'zero-conversion': {
        description: 'Campaign spending with zero conversions',
        defaultDateRange: { days: 1 },
    },
    'high-roas': {
        description: 'Campaign with exceptionally high ROAS',
        defaultDateRange: { days: 1 },
    },
    'missing-metrics': {
        description: 'Campaign with incomplete metric data',
        defaultDateRange: { days: 1 },
    },
    'baseline-comparison': {
        description: 'Requires baseline for DROP_PERCENT evaluation',
        defaultDateRange: { days: 7 },
    },
} as const;

export type PredefinedScenarioName = keyof typeof PREDEFINED_SCENARIOS;

/**
 * Helper to create context from predefined scenario
 */
export function createPredefinedScenarioContext(
    scenarioName: PredefinedScenarioName,
    tenantId: string,
    overrides?: Partial<Omit<SimulationContext, 'scenarioName' | 'tenantId'>>
): SimulationContext {
    const predefined = PREDEFINED_SCENARIOS[scenarioName];
    const days = predefined.defaultDateRange.days;

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);

    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);

    return createSimulationContext({
        tenantId,
        scenarioName,
        dateRange: { start, end },
        mode: 'FIXTURE',
        description: predefined.description,
        ...overrides,
    });
}
