/**
 * =============================================================================
 * SeedUnifiedUi — Command UI Handler
 * =============================================================================
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { container } from 'tsyringe';
import { ICommandRegistry, TenantId } from '../../core/contracts';
import { CommandUi } from './command-ui.interface';
import { runCommandSafe } from './ui-runner';
import { SeedUnifiedCommand, SeedUnifiedResult } from '../seed-unified.command';
import { ScenarioLoader } from '../../scenarios/scenario-loader';
import { promptForScenario } from './prompts';
import { ToolkitPlatform } from '../../domain/platform.types';
import { SEEDABLE_PLATFORMS } from '../../domain/platform-capabilities';

export class SeedUnifiedUi implements CommandUi {
    readonly name = 'seed-unified-scenario';

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
                'Select scenario to seed:',
                'baseline',
            );
        }

        let mode = args?.mode as 'GENERATED' | 'FIXTURE' | 'HYBRID';
        let seed = args?.seed ? Number(args.seed) : 12345;
        let days = args?.days ? Number(args.days) : 30;
        let platforms = args?.platforms as string || '';
        let allowReal = args?.allowReal === true || args?.allowReal === 'true';
        let dryRun = args?.dryRun !== false && args?.dryRun !== 'false'; // Default true

        if (!isHeadless) {
            const answers = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'mode',
                    message: 'Execution Mode:',
                    choices: [
                        { name: '[Generated] Simulate from seed', value: 'GENERATED' },
                        { name: '[Fixture] Load golden file', value: 'FIXTURE' },
                        { name: '[Hybrid] Validate match', value: 'HYBRID' }
                    ],
                    default: mode || 'GENERATED'
                },
                {
                    type: 'number',
                    name: 'seed',
                    message: 'Deterministic seed (integer):',
                    default: seed,
                },
                {
                    type: 'number',
                    name: 'days',
                    message: 'Days of history:',
                    default: days,
                },
                {
                    type: 'input',
                    name: 'platforms',
                    message: 'Platforms (CSV, blank=all seedable: google,facebook,tiktok,line,shopee,lazada):',
                    default: platforms,
                },
                {
                    type: 'confirm',
                    name: 'allowReal',
                    message: 'Allow seeding on tenant with real data?',
                    default: allowReal,
                },
                {
                    type: 'confirm',
                    name: 'dryRun',
                    message: 'Dry run (recommended)?',
                    default: dryRun,
                },
            ]);

            mode = answers.mode;
            seed = answers.seed;
            days = answers.days;
            platforms = answers.platforms;
            allowReal = answers.allowReal;
            dryRun = answers.dryRun;
        }

        const command = new SeedUnifiedCommand({
            tenant: tenantId,
            scenario,
            mode: mode || 'GENERATED',
            seed,
            days,
            platforms: platforms || undefined, // undefined means ALL
            dryRun,
            allowRealTenant: allowReal,
        });

        const { success, data } = await runCommandSafe(command, tenantId, registry, { dryRun });

        if (success) {
            this.displayResult(data as SeedUnifiedResult);
        }
    }

    private displayResult(result: SeedUnifiedResult): void {
        console.log(chalk.green(`\nSUCCESS: Unified Seed Completed`));
        console.log(chalk.gray(`Source Tag: ${result.sourceTag}`));
        console.log(chalk.gray(`Rows Created: ${result.rowsCreated}`));
        console.log(chalk.gray(`Platforms: ${result.platformsProcessed.join(', ')}`));

        if (result.manifestPath) {
            console.log(chalk.gray(`Manifest: ${result.manifestPath}`));
        }

        const args = result.manifest?.config?.args;
        if (args) {
            console.log(chalk.white(`   Scenario: ${chalk.cyan(args.scenario)}`));
            console.log(chalk.white(`   Seed: ${chalk.yellow(args.seed)}`));
            console.log(chalk.white(`   Days: ${chalk.yellow(args.days)}`));
        }

        console.log(chalk.gray('\n' + '-'.repeat(60)));
    }
}
