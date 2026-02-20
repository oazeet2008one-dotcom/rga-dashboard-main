/**
 * =============================================================================
 * Actionable Hints — User Guidance
 * =============================================================================
 * 
 * Provides contextual hints for errors encountered during CLI execution.
 */

import chalk from 'chalk';

export function printActionableHints(commandName: string, errorMessage: string): void {
    const hints = getActionableHints(commandName, errorMessage);
    if (hints.length === 0) {
        return;
    }

    console.log(chalk.cyan('Next steps:'));
    for (const hint of hints) {
        console.log(chalk.gray(`  - ${hint}`));
    }
    console.log('');
}

export function getActionableHints(commandName: string, errorMessage: string): string[] {
    const msg = errorMessage.toLowerCase();
    const hints: string[] = [];

    if (
        msg.includes('schema parity') ||
        msg.includes('missing columns') ||
        msg.includes('column') ||
        msg.includes('p2022')
    ) {
        hints.push('Run command: npm run toolkit:isolated:migrate');
        hints.push('Run command: npm run toolkit:preflight and confirm GO before retrying');
    }

    if (
        msg.includes('safety gate') ||
        msg.includes('blocked') ||
        msg.includes('toolkit_env') ||
        msg.includes('unsafe')
    ) {
        hints.push('Set TOOLKIT_ENV to LOCAL, DEV, or CI for non-production runs');
        hints.push('If using a non-standard DB host, set TOOLKIT_SAFE_DB_HOSTS and rerun preflight');
    }

    if (msg.includes('scenario') && (msg.includes('not found') || msg.includes('invalid'))) {
        hints.push('Pick an existing scenario in CLI or add a file under src/toolkit/scenarios');
    }

    if (msg.includes('tenant') && msg.includes('not found')) {
        hints.push('Bootstrap tenant via: npm run toolkit:bootstrap-tenant -- --id=<tenant-id> --slug=<tenant-slug> --name="Tenant Name"');
    }

    if (msg.includes('node.js runtime') || msg.includes('unsupported node')) {
        hints.push('Switch Node.js to the version in .nvmrc and retry');
    }

    if (hints.length === 0) {
        hints.push('Run command: npm run toolkit:preflight to get GO/NO-GO diagnostics');
        hints.push(`Inspect latest manifest for "${commandName}" under tmp/e2e-reports`);
    }

    return [...new Set(hints)];
}
