/**
 * =============================================================================
 * Common CLI Prompts
 * =============================================================================
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { PrismaClient } from '@prisma/client';
import { createTenantId } from '../../core/contracts';
import { ScenarioLoader, ScenarioOption } from '../../scenarios/scenario-loader';

const MANUAL_TENANT_OPTION = '__MANUAL_TENANT__';
const MANUAL_SCENARIO_OPTION = '__MANUAL_SCENARIO__';

export async function promptForTenant(
    prisma: PrismaClient,
): Promise<import('../../core/contracts').TenantId | null> {
    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            slug: true,
            name: true,
        },
        orderBy: [{ name: 'asc' }],
        take: 200,
    });

    if (tenants.length === 0) {
        console.log(chalk.yellow('\nWARNING: No tenants found in database. Enter tenant ID manually.\n'));
        return promptForTenantManual();
    }

    const tenantChoices = tenants.map((tenant) => ({
        name: `${tenant.name} (${tenant.slug}) [${tenant.id.slice(0, 8)}]`,
        value: tenant.id,
    }));

    const { selectedTenantId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedTenantId',
            message: 'Select tenant:',
            choices: [
                ...tenantChoices,
                new inquirer.Separator(chalk.gray('-'.repeat(45))),
                { name: 'Enter tenant ID manually', value: MANUAL_TENANT_OPTION },
            ],
            pageSize: 16,
        },
    ]);

    if (selectedTenantId === MANUAL_TENANT_OPTION) {
        return promptForTenantManual();
    }

    return createTenantId(String(selectedTenantId));
}

export async function promptForTenantManual(): Promise<import('../../core/contracts').TenantId | null> {
    const { tenantId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'tenantId',
            message: 'Enter tenant ID (or leave blank to skip):',
        },
    ]);

    const normalizedTenantId = typeof tenantId === 'string' ? tenantId.trim() : '';
    return normalizedTenantId ? createTenantId(normalizedTenantId) : null;
}

export async function promptForScenario(
    scenarioLoader: ScenarioLoader,
    message: string,
    fallbackScenarioId = 'baseline',
): Promise<string> {
    const scenarios = await scenarioLoader.listAvailableScenarios();

    if (scenarios.length === 0) {
        const { scenarioId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'scenarioId',
                message,
                default: fallbackScenarioId,
                validate: (input: string) => input.trim().length > 0 ? true : 'Scenario ID is required',
            },
        ]);
        return String(scenarioId).trim();
    }

    const choices = scenarios.map((scenario: ScenarioOption) => {
        const aliasLabel = scenario.aliases.length > 0 ? ` (aliases: ${scenario.aliases.join(', ')})` : '';
        return {
            name: `${scenario.scenarioId}: ${scenario.name}${aliasLabel}`,
            value: scenario.scenarioId,
        };
    });

    const { selectedScenarioId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedScenarioId',
            message,
            choices: [
                ...choices,
                new inquirer.Separator(chalk.gray('-'.repeat(45))),
                { name: 'Enter scenario ID manually', value: MANUAL_SCENARIO_OPTION },
            ],
            default: scenarios.some((s) => s.scenarioId === fallbackScenarioId)
                ? fallbackScenarioId
                : scenarios[0].scenarioId,
            pageSize: 16,
        },
    ]);

    if (selectedScenarioId === MANUAL_SCENARIO_OPTION) {
        const { scenarioId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'scenarioId',
                message: 'Enter scenario ID:',
                default: fallbackScenarioId,
                validate: (input: string) => input.trim().length > 0 ? true : 'Scenario ID is required',
            },
        ]);
        return String(scenarioId).trim();
    }

    return String(selectedScenarioId);
}
