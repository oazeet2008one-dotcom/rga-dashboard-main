/**
 * =============================================================================
 * ResetTenantHardUi — Command UI Handler (Hard Reset)
 * =============================================================================
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { container } from 'tsyringe';
import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
import { runCommandSafe } from './ui-runner';
import { createResetTenantHardCommand } from '../definitions/reset-tenant.command';
import { ResetTenantHardCommandHandler } from '../reset-tenant.handler';
import { displayResetTenantResult } from './reset-tenant.common';

export class ResetTenantHardUi implements CommandUi {
    readonly name = 'reset-tenant-hard';

    async execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void> {
        console.log(chalk.red.bold('\n[DANGER] HARD RESET - DESTRUCTIVE OPERATION\n'));
        console.log(chalk.red('This will DELETE:'));
        console.log(chalk.red('  - All metrics and historical data'));
        console.log(chalk.red('  - All campaign definitions'));
        console.log(chalk.red('  - All alert rules and definitions'));
        console.log(chalk.red('  - All alert history\n'));
        console.log(chalk.yellow('Preserved:'));
        console.log(chalk.yellow('  - Tenant identity'));
        console.log(chalk.yellow('  - User accounts'));
        console.log(chalk.yellow('  - Integration configurations\n'));

        const { generateToken } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'generateToken',
                message: 'Generate confirmation token?',
                default: false,
            },
        ]);

        if (!generateToken) {
            console.log(chalk.gray('\nOperation cancelled.\n'));
            return;
        }

        // Generate token using the handler
        const handler = container.resolve(ResetTenantHardCommandHandler);
        const { token, expiresAt } = handler.generateConfirmationToken(tenantId);

        console.log(chalk.cyan('\nConfirmation Token Generated:'));
        console.log(chalk.white(`   Token: ${token}`));
        console.log(chalk.yellow(`   Expires: ${expiresAt.toISOString()}`));
        console.log(chalk.gray('   Valid for: 5 minutes\n'));

        const { confirmToken, finalConfirm, dryRun } = await inquirer.prompt([
            {
                type: 'input',
                name: 'confirmToken',
                message: 'Enter confirmation token to proceed:',
            },
            {
                type: 'confirm',
                name: 'finalConfirm',
                message: chalk.red.bold('FINAL CONFIRMATION: This CANNOT be undone. Proceed?'),
                default: false,
            },
            {
                type: 'confirm',
                name: 'dryRun',
                message: 'Dry run (recommended)?',
                default: true,
            },
        ]);

        if (confirmToken !== token) {
            console.log(chalk.red('\nERROR: Invalid confirmation token. Operation cancelled.\n'));
            return;
        }

        if (!finalConfirm) {
            console.log(chalk.gray('\nOperation cancelled.\n'));
            return;
        }

        const command = createResetTenantHardCommand(tenantId, {
            mode: 'HARD',
            confirmedAt: new Date(),
            confirmationToken: token,
        });

        const { success, data } = await runCommandSafe(command, tenantId, registry, { dryRun });

        if (success) {
            displayResetTenantResult(data);
        }
    }
}
