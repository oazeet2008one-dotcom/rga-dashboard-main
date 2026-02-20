/**
 * =============================================================================
 * AlertScenarioUi — Command UI Handler
 * =============================================================================
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
import { runCommandSafe } from './ui-runner';
import { createAlertScenarioCommand } from '../definitions/alert-scenario.command';
import { AlertScenarioResult } from '../../services/alert-scenario.service';

export class AlertScenarioUi implements CommandUi {
    readonly name = 'alert-scenario';

    async execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void> {
        const { seedBaseline, injectAnomaly, days, dryRun } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'seedBaseline',
                message: 'Seed baseline historical data?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'injectAnomaly',
                message: 'Inject anomaly data?',
                default: true,
            },
            {
                type: 'number',
                name: 'days',
                message: 'Number of days for baseline data:',
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

        const command = createAlertScenarioCommand(tenantId, {
            seedBaseline,
            injectAnomaly,
            days,
        });

        const { success, data } = await runCommandSafe(command, tenantId, registry, { dryRun });

        if (success) {
            this.displayResult(data);
        }
    }

    private displayResult(result: unknown): void {
        const scenarioResult = result as AlertScenarioResult;

        if (!scenarioResult.success) {
            console.log(chalk.red('\nERROR: Alert scenario failed'));
            console.log(chalk.gray(scenarioResult.message));
            if (scenarioResult.error) {
                console.log(chalk.red(scenarioResult.error));
            }
            return;
        }

        if (scenarioResult.status === 'no_campaigns') {
            console.log(chalk.yellow('\nWARNING: No campaigns found'));
            console.log(chalk.gray(scenarioResult.message));
            console.log(chalk.cyan('\nSuggestions:'));
            console.log(chalk.gray('  - Create a campaign via API first'));
            console.log(chalk.gray('  - Enable auto-create option (not available in MVP)'));
            return;
        }

        if (scenarioResult.data) {
            const { seedResult, anomalyInjected, alertCheck } = scenarioResult.data;

            console.log(chalk.green('\nSUCCESS: Alert scenario completed'));
            console.log(chalk.gray('\n' + '-'.repeat(60)));

            // Step 1: Baseline
            console.log(chalk.cyan('\nStep 1: Baseline Data'));
            console.log(chalk.white(`   Rows Seeded: ${chalk.green(seedResult.seededCount)}`));
            console.log(chalk.white(`   Campaigns: ${chalk.green(seedResult.campaignCount)}`));
            console.log(chalk.white(`   Date Range: ${chalk.cyan(seedResult.dateRange.start)} to ${chalk.cyan(seedResult.dateRange.end)}`));

            // Step 2: Anomaly
            console.log(chalk.cyan('\nStep 2: Anomaly Injection'));
            console.log(chalk.white(`   Status: ${anomalyInjected ? chalk.yellow('Injected') : chalk.gray('Skipped')}`));

            // Step 3: Alert Check
            console.log(chalk.cyan('\nStep 3: Alert Evaluation'));
            console.log(chalk.white(`   Evaluated At: ${chalk.gray(alertCheck.evaluatedAt.toISOString())}`));
            console.log(chalk.white(`   Snapshots: ${chalk.green(alertCheck.metadata.snapshotsEvaluated)}`));
            console.log(chalk.white(`   Rules Evaluated: ${chalk.green(alertCheck.metadata.totalRulesEvaluated)}`));
            console.log(chalk.white(`   Alerts Triggered: ${alertCheck.triggeredAlerts.length > 0 ? chalk.red(alertCheck.triggeredAlerts.length) : chalk.green(0)}`));

            if (alertCheck.triggeredAlerts.length > 0) {
                console.log(chalk.cyan('\nTriggered Alerts:'));
                alertCheck.triggeredAlerts.forEach((alert, index) => {
                    const severityColor = alert.severity === 'CRITICAL' ? chalk.red :
                        alert.severity === 'HIGH' ? chalk.yellow :
                            alert.severity === 'MEDIUM' ? chalk.blue : chalk.gray;
                    console.log(
                        chalk.gray(`   ${index + 1}. `) +
                        severityColor(`[${alert.severity}] `) +
                        chalk.white(alert.ruleName)
                    );
                    console.log(chalk.gray(`      Reason: ${alert.reason}`));
                });
            }

            console.log(chalk.gray('\n' + '-'.repeat(60)));
        }
    }
}
