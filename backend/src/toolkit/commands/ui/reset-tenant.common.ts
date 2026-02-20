/**
 * =============================================================================
 * ResetTenant Common UI Logic
 * =============================================================================
 */

import chalk from 'chalk';
import { ResetResult } from '../../services/tenant-reset.service';

export function displayResetTenantResult(result: unknown): void {
    const resetResult = result as ResetResult;

    if (!resetResult.success) {
        console.log(chalk.red('\nERROR: Reset failed'));
        console.log(chalk.gray(resetResult.message));
        if (resetResult.error) {
            console.log(chalk.red(resetResult.error));
        }
        return;
    }

    if (resetResult.data) {
        const { deletedMetrics, deletedAlerts, deletedCampaigns, deletedAlertDefinitions, durationMs } = resetResult.data;
        const mode = resetResult.mode;
        const isHard = mode === 'HARD';
        const color = isHard ? chalk.red : chalk.green;

        console.log(color(`\nSUCCESS: Tenant ${mode.toLowerCase()} reset completed`));
        console.log(chalk.gray('\n' + '-'.repeat(60)));
        console.log(chalk.cyan('\nDeletion Summary:\n'));
        console.log(chalk.white(`   Mode: ${isHard ? chalk.red.bold('HARD') : chalk.green('PARTIAL')}`));
        console.log(chalk.white(`   Metrics Deleted: ${chalk.yellow(deletedMetrics || 0)}`));
        console.log(chalk.white(`   Alert Records Deleted: ${chalk.yellow(deletedAlerts || 0)}`));

        if (isHard) {
            console.log(chalk.red(`   Campaigns Deleted: ${deletedCampaigns || 0}`));
            console.log(chalk.red(`   Alert Rules Deleted: ${deletedAlertDefinitions || 0}`));
        } else {
            console.log(chalk.gray('   Campaigns: Preserved'));
            console.log(chalk.gray('   Alert Rules: Preserved'));
        }

        console.log(chalk.gray(`\n   Duration: ${durationMs}ms`));

        if (isHard) {
            console.log(chalk.red.bold('\nWARNING: Hard reset was performed.'));
            console.log(chalk.red('   Campaigns and alert rules must be recreated from scratch.'));
        }

        console.log(chalk.gray('\n' + '-'.repeat(60)));
    }
}
