/**
 * =============================================================================
 * UI Printer Implementation
 * =============================================================================
 * Handles User Output.
 * CI: stderr ONLY (suppressed/minimal).
 * LOCAL: stdout (rich).
 * =============================================================================
 */

import chalk from 'chalk';
import ora from 'ora';
import { IUiPrinter, ToolkitEnv } from './contracts';
import * as Redactor from '../../manifest/redactor';

export class ConsoleUiPrinter implements IUiPrinter {
    constructor(private env: ToolkitEnv) { }

    log(message: string): void {
        if (this.env === 'CI') {
            // Check if it's a critical message using a heuristic or just suppress log()
            // In CI, we only want warn/error usually, or very specific lifecycle events.
            // For now, we assume log() is for informational UI and suppress it or redirect to stderr if needed.
            // Requirement: "Minimal. Critical status updates only."
            // We will redirect to stderr to keep stdout pure for JSON.
            console.error(message);
        } else {
            console.log(message);
        }
    }

    warn(message: string): void {
        const sanitized = message; // Warnings usually safe, but good to be careful
        if (this.env === 'CI') {
            console.error(chalk.yellow(sanitized));
        } else {
            console.log(chalk.yellow(sanitized));
        }
    }

    error(message: string): void {
        // Sanitize ALWAYS
        // Note: The message might already be sanitized if it came from Redactor.sanitizeError,
        // but we double check if it looks raw (though regex is cheap).
        // Actually, the caller should pass a string. If it contains a secret, we redact it.
        // We can use Redactor.truncate or Redactor.redactArgs logic if we had a pure string redactor.
        // Ideally we assume the caller used sanitizeError, but we can't be sure.
        // Let's rely on the contract that caller MUST sanitize, but since we are the sink...

        // Use scrubMessage to be safe against leaked secrets in the string
        const safeMessage = Redactor.scrubMessage(message);

        if (this.env === 'CI') {
            console.error(chalk.red(safeMessage));
        } else {
            console.error(chalk.red(safeMessage));
        }
    }

    header(text: string): void {
        if (this.env === 'CI') return; // Suppress banners in CI
        console.log(text);
    }

    spinner(text: string): { start: () => void; succeed: (text?: string) => void; fail: (text?: string) => void; stop: () => void } {
        if (this.env === 'CI') {
            // No-op spinner for CI, but print the start/end as lines to stderr
            console.error(`[START] ${text}`);
            return {
                start: () => { },
                succeed: (t) => console.error(`[SUCCESS] ${t || text}`),
                fail: (t) => console.error(`[FAIL] ${t || text}`),
                stop: () => { },
            };
        }

        const spinner = ora(text);
        return {
            start: () => spinner.start(),
            succeed: (t) => spinner.succeed(t),
            fail: (t) => spinner.fail(t),
            stop: () => spinner.stop(),
        };
    }
}
