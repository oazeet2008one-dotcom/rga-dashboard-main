/**
 * =============================================================================
 * SeedGoogleAdsUi — Command UI Handler
 * =============================================================================
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
import { runCommandSafe } from './ui-runner';
import { createSeedGoogleAdsCommand } from '../definitions/seed-google-ads.command';
import { SeederResult } from '../../services/google-ads-seeder.service';

export class SeedGoogleAdsUi implements CommandUi {
    readonly name = 'seed-google-ads';

    async execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void> {
        const { days, dryRun } = await inquirer.prompt([
            {
                type: 'number',
                name: 'days',
                message: 'Number of days to generate:',
                default: 30,
                validate: (input: number) => {
                    if (input < 1 || input > 365) {
                        return 'Please enter a value between 1 and 365';
                    }
                    return true;
                },
            },
            {
                type: 'confirm',
                name: 'dryRun',
                message: 'Dry run (recommended)?',
                default: true,
            },
        ]);

        const command = createSeedGoogleAdsCommand(tenantId, days);

        const { success, data } = await runCommandSafe(command, tenantId, registry, { dryRun });

        if (success) {
            this.displayResult(data);
        }
    }

    private displayResult(result: unknown): void {
        const seederResult = result as SeederResult;

        if (!seederResult.success) {
            console.log(chalk.red('\nERROR: Seeding failed'));
            console.log(chalk.gray(seederResult.message));
            if (seederResult.error) {
                console.log(chalk.red(seederResult.error));
            }
            return;
        }

        if (seederResult.status === 'no_campaigns') {
            console.log(chalk.yellow('\nWARNING: No campaigns found'));
            console.log(chalk.gray(seederResult.message));
            console.log(chalk.cyan('\nSuggestions:'));
            console.log(chalk.gray('  - Connect Google Ads integration first'));
            console.log(chalk.gray('  - Create a test campaign via API'));
            console.log(chalk.gray('  - Run the Alert Scenario action (it can auto-create campaigns)'));
            return;
        }

        if (seederResult.data) {
            const { seededCount, campaignCount, dateRange, campaigns } = seederResult.data;

            console.log(chalk.green('\nSUCCESS: Google Ads historical data seeded'));
            console.log(chalk.gray('\n' + '-'.repeat(60)));
            console.log(chalk.cyan('\nSummary:\n'));
            console.log(chalk.white(`   Total Rows Seeded: ${chalk.green(seededCount || 0)}`));
            console.log(chalk.white(`   Campaigns Updated: ${chalk.green(campaignCount || 0)}`));

            if (dateRange) {
                console.log(chalk.white(`   Date Range: ${chalk.cyan(dateRange.start)} to ${chalk.cyan(dateRange.end)}`));
            }

            if (campaigns && campaigns.length > 0) {
                console.log(chalk.cyan('\nCampaigns:'));
                campaigns.forEach((campaign, index) => {
                    console.log(
                        chalk.gray(`   ${index + 1}. `) +
                        chalk.white(campaign.name) +
                        chalk.gray(` (${campaign.rowsCreated} rows, ${campaign.trendProfile})`)
                    );
                });
            }

            console.log(chalk.gray('\n' + '-'.repeat(60)));
        }
    }
}
