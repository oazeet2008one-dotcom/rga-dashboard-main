import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { VerificationResult } from './types';
import { resolveOutputDir } from '../../toolkit/core/output-path-policy';

@Injectable()
export class ReportWriter {
    private readonly logger = new Logger(ReportWriter.name);

    /**
     * Safely writes the verification report to disk.
     * Enforces directory confinement (T6).
     * Canonicalizes output for determinism (T5).
     */
    async writeReport(result: VerificationResult, outputDir: string): Promise<string> {
        // 1. Validate output directory against allowlisted roots
        const normalizedDir = resolveOutputDir('report', outputDir);

        // Validate runId (must be safe filename)
        if (!/^[a-zA-Z0-9_-]+$/.test(result.meta.runId)) {
            throw new Error(`Security Violation: Invalid Run ID '${result.meta.runId}'. Run ID must be alphanumeric.`);
        }

        const filename = `verify-${result.meta.runId}.json`;
        const fullPath = path.join(normalizedDir, filename);

        // 2. Canonicalize JSON
        const jsonContent = this.canonicalize(result);

        // 3. Atomic Write
        // Write to .tmp then rename
        const tmpPath = `${fullPath}.tmp`;

        try {
            await fs.promises.mkdir(normalizedDir, { recursive: true });
            await fs.promises.writeFile(tmpPath, jsonContent, 'utf8');
            await fs.promises.rename(tmpPath, fullPath);
            this.logger.log(`Report written to ${fullPath}`);
            return fullPath;
        } catch (e: any) {
            this.logger.error(`Failed to write report: ${e.message}`);
            // Cleanup tmp if exists
            try { await fs.promises.unlink(tmpPath); } catch { }
            throw e;
        }
    }

    /**
     * Produces a deterministic JSON string by sorting keys recursively.
     */
    private canonicalize(obj: any): string {
        if (obj === null || typeof obj !== 'object') {
            return JSON.stringify(obj);
        }

        if (Array.isArray(obj)) {
            return '[' + obj.map(item => this.canonicalize(item)).join(',') + ']';
        }

        const keys = Object.keys(obj).sort();
        const parts = keys.map(key => {
            const val = this.canonicalize(obj[key]);
            return `"${key}":${val}`;
        });
        return '{' + parts.join(',') + '}';
    }
}
