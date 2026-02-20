/**
 * =============================================================================
 * Alert Scenario Command (Definition)
 * =============================================================================
 *
 * Command object representing user intent to run alert scenario.
 * This is just data - no logic here (CQS principle).
 *
 * MVP Scope (Locked):
 * - seedBaseline: Whether to seed historical data
 * - injectAnomaly: Whether to inject anomaly data
 * - days: Number of days for baseline data
 * =============================================================================
 */

import { ICommand, CommandName } from '../../core/contracts';

export const ALERT_SCENARIO_COMMAND = 'alert-scenario' as CommandName;

export interface AlertScenarioCommand extends ICommand {
    readonly name: typeof ALERT_SCENARIO_COMMAND;
    readonly tenantId: string;
    readonly seedBaseline: boolean;
    readonly injectAnomaly: boolean;
    readonly days: number;
}

export function createAlertScenarioCommand(
    tenantId: string,
    options: {
        seedBaseline?: boolean;
        injectAnomaly?: boolean;
        days?: number;
    } = {}
): AlertScenarioCommand {
    return {
        name: ALERT_SCENARIO_COMMAND,
        description: 'Run alert scenario with baseline seeding and anomaly injection',
        requiresConfirmation: true, // Destructive: modifies data
        tenantId,
        seedBaseline: options.seedBaseline ?? true,
        injectAnomaly: options.injectAnomaly ?? true,
        days: options.days ?? 30,
    };
}
