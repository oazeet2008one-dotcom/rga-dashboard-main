/**
 * =============================================================================
 * Fixture Schedule Provider
 * =============================================================================
 *
 * Loads scheduled executions from JSON fixture files.
 *
 * Design Principles:
 * - File-based configuration for reproducible tests
 * - Built-in caching (read once, serve many)
 * - Validates on load (fail fast)
 * - Tenant-aware filtering
 * - Works fully offline
 * - No business logic (no time evaluation)
 *
 * Fixture format (JSON per tenant):
 * ```json
 * {
 *   "version": "1.0",
 *   "schedules": [ ScheduledExecution, ScheduledExecution, ... ]
 * }
 * ```
 * =============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { injectable, inject } from 'tsyringe';
import { ILogger, TOKENS } from '../core';
import {
    ScheduledExecution,
    IScheduleProvider,
    validateScheduledExecution,
} from './scheduled-execution.model';

// =============================================================================
// Fixture File Format
// =============================================================================

interface FixtureFile {
    version: string;
    schedules: ScheduledExecution[];
}

// =============================================================================
// Configuration
// =============================================================================

export interface FixtureScheduleProviderConfig {
    /**
     * Base directory for fixture files
     * Default: auto-detected
     */
    readonly fixturesDir?: string;
}

// =============================================================================
// Fixture Schedule Provider
// =============================================================================

@injectable()
export class FixtureScheduleProvider implements IScheduleProvider {
    private cache: Map<string, FixtureFile> = new Map();
    private readonly logger: ILogger;
    private readonly fixturesDir: string;

    constructor(
        @inject(TOKENS.Logger) logger: ILogger,
        config?: FixtureScheduleProviderConfig
    ) {
        this.logger = logger.child({ source: 'FixtureScheduleProvider' });
        this.fixturesDir = config?.fixturesDir ?? this.resolveFixturesDir();
    }

    /**
     * Load all scheduled executions for a tenant.
     *
     * Loads from tenant-specific fixture file.
     * Returns only enabled schedules for the tenant.
     */
    async getSchedulesForTenant(tenantId: string): Promise<ScheduledExecution[]> {
        const allSchedules = await this.loadAllSchedules(tenantId);
        return allSchedules.filter(
            (s) => s.tenantId === tenantId && s.enabled
        );
    }

    /**
     * Clear the in-memory cache.
     * Forces re-read from disk on next access.
     */
    clearCache(): void {
        this.cache.clear();
        this.logger.debug('Cleared fixture cache');
    }

    // =========================================================================
    // Private Implementation
    // =========================================================================

    private async loadAllSchedules(tenantId: string): Promise<ScheduledExecution[]> {
        // Check cache first
        const cached = this.cache.get(tenantId);
        if (cached) {
            return cached.schedules;
        }

        // Load from file
        const fixturePath = path.join(this.fixturesDir, `${tenantId}.json`);
        const fixture = await this.loadFixtureFile(fixturePath);

        // Validate all schedules
        const errors: string[] = [];
        for (let i = 0; i < fixture.schedules.length; i++) {
            const validation = validateScheduledExecution(fixture.schedules[i]);
            if (!validation.valid) {
                errors.push(
                    `[${i}] ${validation.errors.join(', ')}`
                );
            }
        }

        if (errors.length > 0) {
            throw new Error(
                `Invalid schedules in fixture ${fixturePath}:\n${errors.join('\n')}`
            );
        }

        // Cache and return
        this.cache.set(tenantId, fixture);
        this.logger.debug(
            `Loaded ${fixture.schedules.length} schedules from ${fixturePath}`
        );

        return fixture.schedules;
    }

    private async loadFixtureFile(filePath: string): Promise<FixtureFile> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content) as FixtureFile;

            // Validate structure
            if (!parsed.version) {
                throw new Error(`Missing "version" field in fixture: ${filePath}`);
            }
            if (!Array.isArray(parsed.schedules)) {
                throw new Error(
                    `Missing or invalid "schedules" array in fixture: ${filePath}`
                );
            }

            return parsed;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                this.logger.warn(`Fixture file not found: ${filePath}`);
                return { version: '1.0', schedules: [] };
            }
            throw new Error(
                `Failed to load fixture ${filePath}: ${(error as Error).message}`
            );
        }
    }

    private resolveFixturesDir(): string {
        // Try to find fixtures directory relative to this file
        const currentFile = __filename;
        const possiblePaths = [
            // Development: backend/src/toolkit/schedules -> backend/src/toolkit/fixtures/schedules
            path.join(path.dirname(currentFile), '..', 'fixtures', 'schedules'),
            // Compiled: backend/dist/toolkit/schedules -> backend/src/toolkit/fixtures/schedules
            path.join(
                path.dirname(currentFile),
                '..',
                '..',
                '..',
                'src',
                'toolkit',
                'fixtures',
                'schedules'
            ),
        ];

        for (const dir of possiblePaths) {
            if (fs.existsSync(dir)) {
                return dir;
            }
        }

        // Default to first option (will fail gracefully with empty schedules if not found)
        return possiblePaths[0]!;
    }
}
