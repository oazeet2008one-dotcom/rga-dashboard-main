/**
 * =============================================================================
 * VerifyScenarioUi — Command UI Handler
 * =============================================================================
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { container } from 'tsyringe';
import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
import { runCommandSafe } from './ui-runner';
import { VerifyScenarioCommand, VerifyScenarioResult } from '../verify-scenario.command';
import { ScenarioLoader } from '../../scenarios/scenario-loader';
import { promptForScenario } from './prompts';

export class VerifyScenarioUi implements CommandUi {
    readonly name = 'verify-scenario';

    async execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void> {
        const scenarioLoader = container.resolve(ScenarioLoader);
        const isHeadless = args?.headless === true || args?.nonInteractive === true;

        let scenario = args?.scenario as string;
        if (!scenario) {
            if (isHeadless) {
                throw new Error('ERROR: --scenario is required in headless mode');
            }
            scenario = await promptForScenario(
                scenarioLoader,
                'Select scenario to verify:',
                'baseline',
            );
        }
        let dryRun = args?.dryRun !== false && args?.dryRun !== 'false'; // Default TRUE for safety

        if (!isHeadless) {
            const answers = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'dryRun',
                    message: 'Dry run (verify logic/integrity but skip reporting)?',
                    default: dryRun,
                },
            ]);
            dryRun = answers.dryRun;
        }

        const command = new VerifyScenarioCommand({
            tenantId,
            scenarioId: scenario,
            dryRun,
        });

        const { success, data } = await runCommandSafe(command, tenantId, registry, { dryRun });

        if (success) {
            this.displayResult(data as VerifyScenarioResult);
        }
    }

    private displayResult(result: unknown): void {
        const verifyResult = result as VerifyScenarioResult;

        if (verifyResult.status === 'FAIL') {
            console.log(chalk.red('\nERROR: Verification failed'));
        } else if (verifyResult.status === 'WARN') {
            console.log(chalk.yellow('\nWARNING: Verification completed with warnings'));
        } else {
            console.log(chalk.green('\nSUCCESS: Verification passed'));
        }

        console.log(chalk.gray(`Report: ${verifyResult.reportPath}`));

        if (verifyResult.summary) {
            const { passed, failed, warnings } = verifyResult.summary;
            console.log(chalk.gray('\n' + '-'.repeat(60)));
            console.log(chalk.cyan('\nVerification Summary(Legacy):'));
            console.log(chalk.green(`   Passed: ${passed}`));
            console.log(chalk.red(`   Failed: ${failed}`));
            console.log(chalk.yellow(`   Warnings: ${warnings}`));
            console.log(chalk.gray('\n' + '-'.repeat(60)));
        }
    }
}
