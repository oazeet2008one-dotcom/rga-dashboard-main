/**
 * =============================================================================
 * ResetTenantUi — Command UI Handler (Partial Reset)
 * =============================================================================
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
import { runCommandSafe } from './ui-runner';
import { createResetTenantCommand } from '../definitions/reset-tenant.command';
import { displayResetTenantResult } from './reset-tenant.common';

export class ResetTenantUi implements CommandUi {
    readonly name = 'reset-tenant';

    async execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void> {
        const { confirm, dryRun } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: chalk.yellow('This will delete all metrics and alert history. Campaigns and alert rules will be preserved. Continue?'),
                default: false,
            },
            {
                type: 'confirm',
                name: 'dryRun',
                message: 'Dry run (recommended)?',
                default: true,
            },
        ]);

        if (!confirm) {
            console.log(chalk.gray('\nOperation cancelled.\n'));
            return;
        }

        const command = createResetTenantCommand(tenantId);

        const { success, data } = await runCommandSafe(command, tenantId, registry, { dryRun });

        if (success) {
            displayResetTenantResult(data);
        }
    }
}
