/**
 * =============================================================================
 * Configuration Management
 * =============================================================================
 * 
 * Design Principles:
 * - Schema-First: Configuration defined by Zod schema
 * - Fail-Fast: Validate at startup, crash if invalid
 * - Environment-Aware: Different configs per environment
 * - Immutable: Config is readonly after creation
 * =============================================================================
 */

import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { IToolkitConfiguration, ToolkitError } from './contracts';

// Load .env file explicitly
dotenvConfig({ path: resolve(process.cwd(), '.env') });

/**
 * Zod Schema for runtime validation
 * This is the single source of truth for configuration shape
 */
const ConfigurationSchema = z.object({
    // Environment
    NODE_ENV: z.enum(['development', 'staging', 'production'])
        .default('development'),
    
    // Database
    DATABASE_URL: z.string()
        .min(1, 'DATABASE_URL is required')
        .refine(
            url => url.startsWith('postgresql://'),
            'DATABASE_URL must be a PostgreSQL connection string'
        ),
    DATABASE_TIMEOUT: z.string()
        .transform(Number)
        .default('5000')
        .refine(n => n > 0, 'Timeout must be positive'),
    DATABASE_MAX_RETRIES: z.string()
        .transform(Number)
        .default('3')
        .refine(n => n >= 0, 'Max retries must be non-negative'),
    
    // API
    API_BASE_URL: z.string()
        .url()
        .default('http://localhost:3000'),
    API_TIMEOUT: z.string()
        .transform(Number)
        .default('30000'),
    API_RETRY_ATTEMPTS: z.string()
        .transform(Number)
        .default('3'),
    API_RETRY_DELAY: z.string()
        .transform(Number)
        .default('1000'),
    
    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error'])
        .default('info'),
    LOG_FORMAT: z.enum(['json', 'pretty'])
        .default('pretty'),
    
    // Features
    ENABLE_DRY_RUN: z.string()
        .transform(v => v === 'true')
        .default('true'),
    CONFIRM_DESTRUCTIVE: z.string()
        .transform(v => v !== 'false')
        .default('true'),
    MAX_CONCURRENT_COMMANDS: z.string()
        .transform(Number)
        .default('5'),
});

/**
 * Parse and validate environment variables
 * Throws ZodError with detailed messages if invalid
 */
export function loadConfiguration(): IToolkitConfiguration {
    const parsed = ConfigurationSchema.safeParse(process.env);
    
    if (!parsed.success) {
        const formatted = parsed.error.errors
            .map(e => `  - ${e.path.join('.')}: ${e.message}`)
            .join('\n');
        
        throw new ConfigurationError(
            `Invalid configuration:\n${formatted}\n\n` +
            `Please check your .env file and ensure all required variables are set.`
        );
    }
    
    const env = parsed.data;
    
    // Transform to domain model
    // This separation allows changing env var names without touching business logic
    return Object.freeze({
        environment: env.NODE_ENV,
        
        database: {
            url: env.DATABASE_URL,
            timeoutMs: env.DATABASE_TIMEOUT,
            maxRetries: env.DATABASE_MAX_RETRIES,
        },
        
        api: {
            baseUrl: env.API_BASE_URL,
            timeoutMs: env.API_TIMEOUT,
            retryAttempts: env.API_RETRY_ATTEMPTS,
            retryDelayMs: env.API_RETRY_DELAY,
        },
        
        logging: {
            level: env.LOG_LEVEL,
            format: env.LOG_FORMAT,
        },
        
        features: {
            enableDryRun: env.ENABLE_DRY_RUN,
            confirmDestructiveActions: env.CONFIRM_DESTRUCTIVE,
            maxConcurrentCommands: env.MAX_CONCURRENT_COMMANDS,
        },
    });
}

export class ConfigurationError extends ToolkitError {
    readonly code = 'CONFIGURATION_ERROR';
    readonly isRecoverable = false;
    
    constructor(message: string) {
        super(message);
    }
}
