/**
 * =============================================================================
 * SeedDataUi — Command UI Handler (Legacy)
 * =============================================================================
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
import { runCommandSafe } from './ui-runner';
import { SeedDataCommand, SeedDataResult } from '../seed-data.command';
import { ToolkitPlatform } from '../../domain/platform.types';
import { SEEDABLE_PLATFORMS } from '../../domain/platform-capabilities';

export class SeedDataUi implements CommandUi {
    readonly name = 'seed-data';

    async execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void> {
        const { platform, days, trend, anomaly, dryRun } = await inquirer.prompt([
            {
                type: 'list',
                name: 'platform',
                message: 'Select platform:',
                choices: SEEDABLE_PLATFORMS,
            },
            {
                type: 'number',
                name: 'days',
                message: 'Number of days to generate:',
                default: 30,
            },
            {
                type: 'list',
                name: 'trend',
                message: 'Trend pattern:',
                choices: ['stable', 'increasing', 'decreasing', 'seasonal', 'volatile'],
                default: 'stable',
            },
            {
                type: 'confirm',
                name: 'anomaly',
                message: 'Inject anomaly?',
                default: false,
            },
            {
                type: 'confirm',
                name: 'dryRun',
                message: 'Dry run (recommended)?',
                default: true,
            },
        ]);

        const command = new SeedDataCommand({
            platform: platform as ToolkitPlatform,
            days,
            trend,
            injectAnomaly: anomaly,
        });


        const { success } = await runCommandSafe(command, tenantId, registry, { dryRun });

        if (success) {
            console.log(chalk.green('\nSUCCESS: Data seeding completed'));
        }
    }
}
