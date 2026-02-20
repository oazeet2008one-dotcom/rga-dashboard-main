/**
 * =============================================================================
 * Scenario Loader
 * =============================================================================
 * Loads and parses scenario files.
 * Enforces:
 * - Security: Path traversal, Size caps (Exit 78)
 * - Validation: YAML multi-doc ban (Exit 2), Schema validation (Exit 2)
 * - Resolution: Name-only, Aliases
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { injectable } from 'tsyringe';
import { ScenarioSpec } from './scenario-types';
import { validateScenarioSpec } from './scenario-validator';

export interface ScenarioLoaderOptions {
    baseDir?: string;
}

export interface ScenarioOption {
    scenarioId: string;
    name: string;
    aliases: string[];
}

const MAX_FILE_SIZE = 64 * 1024; // 64 KB
const ALLOWED_EXTENSIONS = ['.yaml', '.yml', '.json'];
const NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ScenarioError extends Error {
    constructor(
        public readonly code: string,
        public readonly exitCode: number, // 2 or 78
        message: string
    ) {
        super(message);
        this.name = 'ScenarioError';
    }
}

@injectable()
export class ScenarioLoader {
    private readonly baseDir: string;

    constructor() {
        // Seam: Tests can inject temp dir via setBaseDir.
        // Runtime fallback order keeps compatibility across src/ and dist/ execution.
        const candidateDirs = [
            path.join(__dirname, 'definitions'),
            path.join(__dirname),
            path.join(process.cwd(), 'src', 'toolkit', 'scenarios'),
        ];
        this.baseDir = candidateDirs.find(dir => fs.existsSync(dir)) ?? path.join(__dirname);
    }

    setBaseDir(dir: string) {
        (this as any).baseDir = dir;
    }

    async load(nameOrId: string): Promise<ScenarioSpec> {
        // 1. Security Check: Input format
        if (!NAME_REGEX.test(nameOrId)) {
            // If it looks like a path (contains / or \), fail hard with 78
            if (nameOrId.includes('/') || nameOrId.includes('\\')) {
                throw new ScenarioError('PATH_TRAVERSAL', 78, `Security violation: Path traversal detected in scenario name "${nameOrId}"`);
            }
            throw new ScenarioError('INVALID_SCENARIO_ID', 2, `Invalid scenario name format "${nameOrId}". Must match ${NAME_REGEX}`);
        }

        // 2. Resolution: Try exact match
        let filePath = this.findFile(nameOrId);

        // 3. Resolution: Alias fallback
        if (!filePath) {
            // Expensive scan: load all valid scenarios to check aliases
            const allFiles = this.listScenarioFiles();
            for (const f of allFiles) {
                try {
                    const candidate = this.loadFromFile(f.path, f.name);
                    if (candidate.aliases?.includes(nameOrId)) {
                        console.warn(`[WARN] Scenario alias "${nameOrId}" resolved to "${candidate.scenarioId}".`);
                        return candidate;
                    }
                } catch (e: any) {
                    // Ignore malformed files during alias scan, unless it's a security violation?
                    // But we already validated paths. Malformed YAML shouldn't block checking other files.
                    // However, we shouldn't silently swallow internal errors.
                }
            }
        }

        if (!filePath) {
            // Not found
            throw new ScenarioError('SCENARIO_NOT_FOUND', 2, `Scenario "${nameOrId}" not found (checked .yaml, .yml, .json and aliases)`);
        }

        return this.loadFromFile(filePath, nameOrId);
    }

    async listAvailableScenarios(): Promise<ScenarioOption[]> {
        const files = this.listScenarioFiles();
        const options: ScenarioOption[] = [];

        for (const file of files) {
            try {
                const scenario = this.loadFromFile(file.path, file.name);
                options.push({
                    scenarioId: scenario.scenarioId,
                    name: scenario.name,
                    aliases: scenario.aliases ?? [],
                });
            } catch {
                // Skip invalid scenario files for picker listing.
            }
        }

        return options.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId));
    }

    private findFile(name: string): string | null {
        for (const ext of ALLOWED_EXTENSIONS) {
            const candidate = path.resolve(this.baseDir, name + ext);
            // Check existence + containment
            if (fs.existsSync(candidate) && this.isSafePath(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private listScenarioFiles(): { name: string; path: string }[] {
        if (!fs.existsSync(this.baseDir)) return [];
        return fs.readdirSync(this.baseDir)
            .filter(f => ALLOWED_EXTENSIONS.some(ext => f.endsWith(ext)))
            .map(f => {
                const name = path.basename(f, path.extname(f));
                return { name, path: path.join(this.baseDir, f) };
            });
    }

    private isSafePath(candidate: string): boolean {
        // Verify resolved path strictly starts with baseDir
        const rel = path.relative(this.baseDir, candidate);
        return !rel.startsWith('..') && !path.isAbsolute(rel);
    }

    private loadFromFile(filePath: string, requestedId: string): ScenarioSpec {
        // Redundant safety check (Exit 78) - enforce containment
        if (!this.isSafePath(filePath)) {
            throw new ScenarioError('PATH_TRAVERSAL', 78, 'Resolved path outside base directory');
        }

        // Size check (Exit 78)
        const stats = fs.statSync(filePath);
        if (stats.size > MAX_FILE_SIZE) {
            throw new ScenarioError('FILE_TOO_LARGE', 78, `Scenario file exceeds size limit (${MAX_FILE_SIZE} bytes)`);
        }

        // Extension check (Exit 78) - redundant if findFile used ALLOWED_EXTENSIONS, but good for direct load
        const ext = path.extname(filePath).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new ScenarioError('DISALLOWED_EXTENSION', 78, `Extension ${ext} not allowed`);
        }

        const rawContent = fs.readFileSync(filePath, 'utf8');

        // Multi-doc ban (Exit 2)
        // Check for '---' followed by newline AFTER the first document
        // A single document can start with '---', checks for subsequent
        // Regex: \n---\s*\n
        // We allow leading ---.
        const contentForCheck = rawContent.replace(/^---\s*\r?\n/, ''); // remove leading
        if (/\r?\n---\s*(\r?\n|$)/.test(contentForCheck)) {
            throw new ScenarioError('MULTI_DOCUMENT_NOT_ALLOWED', 2, 'Multi-document YAML is not allowed');
        }

        let parsed: unknown;
        try {
            if (ext === '.json') {
                parsed = JSON.parse(rawContent);
            } else {
                parsed = yaml.load(rawContent, { schema: yaml.DEFAULT_SCHEMA });
            }
        } catch (e: any) {
            throw new ScenarioError('PARSE_ERROR', 2, `Parse error: ${e.message}`);
        }

        // Type guard: yaml.load returns unknown/undefined
        if (!parsed || typeof parsed !== 'object') {
            throw new ScenarioError('PARSE_ERROR', 2, 'File structure is invalid (not an object)');
        }

        // Validate
        const scenarioId = path.basename(filePath, ext); // Id is filename stem
        const validation = validateScenarioSpec(parsed, scenarioId);

        if (!validation.valid) {
            const msgs = validation.errors.map(err => `${err.code}: ${err.message}`).join('; ');
            // Use first error code as primary
            throw new ScenarioError(validation.errors[0].code, 2, `Validation failed: ${msgs}`);
        }

        // Attach inferred scenarioId and return
        return {
            ...(parsed as ScenarioSpec),
            scenarioId
        };
    }
}
