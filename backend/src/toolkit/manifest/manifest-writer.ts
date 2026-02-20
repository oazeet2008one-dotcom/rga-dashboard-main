/**
 * =============================================================================
 * Manifest Writer — Atomic File I/O
 * =============================================================================
 *
 * Strategy: temp-write → fsync → rename → log path.
 * Best-effort: write failures are logged, never throw, never alter exit code.
 *
 * Follows MANIFEST_LIFECYCLE.md §1 Phase 5 (WRITE).
 * =============================================================================
 */

import { promises as fs, constants as fsConstants } from 'fs';
import * as path from 'path';
import { ManifestDocument } from './types';
import { resolveOutputDir } from '../core/output-path-policy';
import { TRUNCATION_LIMITS } from './redactor';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_MANIFEST_DIR = './toolkit-manifests';
const ORPHAN_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// ManifestWriter
// ---------------------------------------------------------------------------

export class ManifestWriter {
    static serialize(manifest: ManifestDocument): { json: string | null; sizeBytes: number; maxBytes: number } {
        const maxBytes = TRUNCATION_LIMITS.MAX_MANIFEST_BYTES;
        const json = JSON.stringify(manifest, null, 2);
        const sizeBytes = Buffer.byteLength(json, 'utf8');
        if (sizeBytes > maxBytes) {
            return { json: null, sizeBytes, maxBytes };
        }
        return { json, sizeBytes, maxBytes };
    }

    /**
     * Resolve the manifest directory from flags/env/default.
     * Precedence: flag > env > cwd-relative default.
     */
    static resolveDir(flagValue: string | null | undefined): string {
        if (flagValue) {
            return resolveOutputDir('manifest', flagValue);
        }
        const envDir = process.env.TOOLKIT_MANIFEST_DIR;
        return resolveOutputDir('manifest', envDir ?? null);
    }

    /**
     * Generate canonical filename.
     * Format: {runId}_{commandName}_{YYYYMMDDTHHMMSSZ}.manifest.json
     */
    static generateFilename(runId: string, commandName: string): string {
        const now = new Date();
        const ts = now.toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d+Z$/, 'Z');
        const safeName = commandName.replace(/[^a-z0-9-]/gi, '_');
        return `${runId}_${safeName}_${ts}.manifest.json`;
    }

    /**
     * Atomically write a manifest to disk.
     * Best-effort: never throws. Returns the written path, or null on failure.
     */
    static async write(
        manifest: ManifestDocument,
        manifestDir?: string,
    ): Promise<string | null> {
        let dir: string;
        try {
            if (manifestDir) {
                dir = resolveOutputDir('manifest', manifestDir);
            } else {
                dir = ManifestWriter.resolveDir(manifest.invocation.flags.manifestDir);
            }
        } catch (pathErr) {
            process.stderr.write(
                `[manifest] Warning: output path blocked by policy: ${pathErr instanceof Error ? pathErr.message : String(pathErr)}\n`,
            );
            return null;
        }

        try {
            // Step 1: Ensure directory exists (best-effort)
            await fs.mkdir(dir, { recursive: true });
        } catch (mkdirErr) {
            process.stderr.write(
                `[manifest] Warning: failed to create directory ${dir}: ${mkdirErr instanceof Error ? mkdirErr.message : String(mkdirErr)}\n`,
            );
            return null;
        }

        const filename = ManifestWriter.generateFilename(
            manifest.runId,
            manifest.invocation.commandName,
        );
        const finalPath = path.join(dir, filename);
        const tempPath = path.join(dir, `.tmp_${manifest.runId}.json`);

        try {
            // Step 2: Write to temp file
            const serialized = ManifestWriter.serialize(manifest);
            if (!serialized.json) {
                process.stderr.write(
                    `[manifest] Warning: manifest size ${serialized.sizeBytes} exceeds cap ${serialized.maxBytes}; skip write\n`,
                );
                return null;
            }

            const json = serialized.json;
            await fs.writeFile(tempPath, json, 'utf-8');

            // Step 3: fsync via open-datasync-close
            let fd: fs.FileHandle | null = null;
            try {
                fd = await fs.open(tempPath, 'r');
                await fd.datasync();
            } catch {
                // fsync failure is non-critical on some systems (Windows)
            } finally {
                if (fd) {
                    await fd.close().catch(() => { });
                }
            }

            // Step 4: Atomic rename
            await fs.rename(tempPath, finalPath);

            return finalPath;
        } catch (writeErr) {
            process.stderr.write(
                `[manifest] Warning: failed to write manifest: ${writeErr instanceof Error ? writeErr.message : String(writeErr)}\n`,
            );

            // Try to clean up temp file
            try {
                await fs.unlink(tempPath);
            } catch {
                // ignore cleanup failure
            }

            return null;
        }
    }

    /**
     * Clean up orphaned .tmp_ files older than maxAge.
     * Best-effort: logs warnings, never throws.
     * Returns number of files cleaned.
     */
    static async cleanupOrphans(
        dir: string,
        maxAgeMs: number = ORPHAN_MAX_AGE_MS,
    ): Promise<number> {
        let cleaned = 0;
        try {
            // Check if directory exists
            await fs.access(dir, fsConstants.R_OK);

            const files = await fs.readdir(dir);
            const orphans = files.filter(f => f.startsWith('.tmp_'));
            const cutoff = Date.now() - maxAgeMs;

            for (const file of orphans) {
                try {
                    const filePath = path.join(dir, file);
                    const stat = await fs.stat(filePath);
                    if (stat.mtimeMs < cutoff) {
                        await fs.unlink(filePath);
                        cleaned++;
                    }
                } catch {
                    // ignore individual file cleanup failures
                }
            }
        } catch {
            // Directory doesn't exist or can't be read — nothing to clean
        }
        return cleaned;
    }
}
