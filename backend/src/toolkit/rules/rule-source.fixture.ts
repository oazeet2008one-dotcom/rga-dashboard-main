/**
 * =============================================================================
 * Fixture Rule Source
 * =============================================================================
 *
 * Loads alert rules from JSON fixture files.
 *
 * Design Principles:
 * - File-based configuration for reproducible tests
 * - Built-in caching (read once, serve many)
 * - Validates on load (fail fast)
 * - Tenant-aware filtering
 * - Works fully offline
 *
 * File format (JSON):
 * ```json
 * {
 *   "version": "1.0",
 *   "rules": [ AlertRule, AlertRule, ... ]
 * }
 * ```
 * =============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { injectable, inject } from 'tsyringe';
import { AlertRule } from './alert-rule.model';
import { RuleValidator } from './rule-validator';
import { ILogger, TOKENS } from '../core';

export interface IRuleSource {
    /**
     * Load all rules for a tenant
     * Returns enabled rules only (disabled rules are filtered out)
     */
    loadRules(tenantId: string): Promise<AlertRule[]>;

    /**
     * Get a specific rule by ID
     * Returns null if not found
     */
    getRule(ruleId: string): Promise<AlertRule | null>;

    /**
     * Clear any internal caches
     */
    clearCache(): void;
}

// =============================================================================
// Fixture File Format
// =============================================================================

interface FixtureFile {
    version: string;
    rules: AlertRule[];
}

// =============================================================================
// Fixture Rule Source
// =============================================================================

@injectable()
export class FixtureRuleSource implements IRuleSource {
    private cache: Map<string, FixtureFile> = new Map();
    private readonly validator: RuleValidator;
    private readonly logger: ILogger;
    private readonly fixturesDir: string;

    constructor(
        @inject(RuleValidator) validator: RuleValidator,
        @inject(TOKENS.Logger) logger: ILogger,
        fixturesDir?: string
    ) {
        this.validator = validator;
        this.logger = logger.child({ source: 'FixtureRuleSource' });
        // Default to toolkit/fixtures/rules relative to project root
        this.fixturesDir = fixturesDir ?? this.resolveFixturesDir();
    }

    /**
     * Load rules for a specific tenant from fixture files
     * Only returns enabled rules
     */
    async loadRules(tenantId: string): Promise<AlertRule[]> {
        const allRules = await this.loadAllRules();
        return allRules.filter((r) => r.tenantId === tenantId && r.enabled);
    }

    /**
     * Get a specific rule by ID
     */
    async getRule(ruleId: string): Promise<AlertRule | null> {
        const allRules = await this.loadAllRules();
        return allRules.find((r) => r.id === ruleId) ?? null;
    }

    /**
     * Clear the in-memory cache
     * Forces re-read from disk on next access
     */
    clearCache(): void {
        this.cache.clear();
        this.logger.debug('Cleared fixture cache');
    }

    // =========================================================================
    // Private Implementation
    // =========================================================================

    private async loadAllRules(): Promise<AlertRule[]> {
        // Check cache first
        const cacheKey = 'default';
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached.rules;
        }

        // Load from file
        const fixturePath = path.join(this.fixturesDir, 'default.json');
        const fixture = await this.loadFixtureFile(fixturePath);

        // Validate all rules
        const validationResult = this.validator.validateMany(fixture.rules);
        if (!validationResult.valid) {
            const errors = validationResult.errors.map(
                (e) => `[${e.field}] ${e.message} (${e.code})`
            );
            throw new Error(
                `Invalid rules in fixture ${fixturePath}:\n${errors.join('\n')}`
            );
        }

        // Cache and return
        this.cache.set(cacheKey, fixture);
        this.logger.debug(`Loaded ${fixture.rules.length} rules from ${fixturePath}`);

        return fixture.rules;
    }

    private async loadFixtureFile(filePath: string): Promise<FixtureFile> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(content) as FixtureFile;

            // Validate structure
            if (!parsed.version) {
                throw new Error(`Missing "version" field in fixture: ${filePath}`);
            }
            if (!Array.isArray(parsed.rules)) {
                throw new Error(`Missing or invalid "rules" array in fixture: ${filePath}`);
            }

            return parsed;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                this.logger.warn(`Fixture file not found: ${filePath}`);
                return { version: '1.0', rules: [] };
            }
            throw new Error(
                `Failed to load fixture ${filePath}: ${(error as Error).message}`
            );
        }
    }

    private resolveFixturesDir(): string {
        // Try to find fixtures directory relative to this file
        // This works in both development and compiled contexts
        const currentFile = __filename;
        const possiblePaths = [
            // Development: backend/src/toolkit/rules -> backend/src/toolkit/fixtures/rules
            path.join(path.dirname(currentFile), '..', 'fixtures', 'rules'),
            // Compiled: backend/dist/toolkit/rules -> backend/src/toolkit/fixtures/rules
            path.join(path.dirname(currentFile), '..', '..', '..', 'src', 'toolkit', 'fixtures', 'rules'),
        ];

        for (const dir of possiblePaths) {
            if (fs.existsSync(dir)) {
                return dir;
            }
        }

        // Default to first option (will fail gracefully with empty rules if not found)
        return possiblePaths[0]!;
    }
}
