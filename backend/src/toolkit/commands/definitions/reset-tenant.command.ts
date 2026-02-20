/**
 * =============================================================================
 * Reset Tenant Command (Definitions)
 * =============================================================================
 *
 * Commands for tenant data reset with two modes:
 * - Partial Reset: Removes operational data (default, safer)
 * - Hard Reset: Removes all data including definitions (destructive)
 *
 * MVP Scope (Locked):
 * - Partial reset is default and requires standard confirmation
 * - Hard reset requires explicit confirmation token
 * - Both preserve tenant identity and user accounts
 * =============================================================================
 */

import { ICommand, CommandName } from '../../core/contracts';
import { ResetMode, ResetConfirmation } from '../../services/tenant-reset.service';

export const RESET_TENANT_COMMAND = 'reset-tenant' as CommandName;
export const RESET_TENANT_HARD_COMMAND = 'reset-tenant-hard' as CommandName;

// -----------------------------------------------------------------------------
// Partial Reset Command (Default)
// -----------------------------------------------------------------------------

export interface ResetTenantCommand extends ICommand {
    readonly name: typeof RESET_TENANT_COMMAND;
    readonly tenantId: string;
    readonly mode: 'PARTIAL';
}

export function createResetTenantCommand(tenantId: string): ResetTenantCommand {
    return {
        name: RESET_TENANT_COMMAND,
        description: 'Reset tenant operational data (metrics, alerts) - preserves campaigns and definitions',
        requiresConfirmation: true,
        tenantId,
        mode: 'PARTIAL',
    };
}

// -----------------------------------------------------------------------------
// Hard Reset Command (Explicit/Destructive)
// -----------------------------------------------------------------------------

export interface ResetTenantHardCommand extends ICommand {
    readonly name: typeof RESET_TENANT_HARD_COMMAND;
    readonly tenantId: string;
    readonly mode: 'HARD';
    readonly confirmation: ResetConfirmation;
}

export function createResetTenantHardCommand(
    tenantId: string,
    confirmation: ResetConfirmation
): ResetTenantHardCommand {
    return {
        name: RESET_TENANT_HARD_COMMAND,
        description: 'HARD RESET: Delete ALL tenant data including campaigns and alert definitions',
        requiresConfirmation: true, // Double confirmation
        tenantId,
        mode: 'HARD',
        confirmation,
    };
}
