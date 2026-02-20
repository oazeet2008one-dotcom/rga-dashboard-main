/**
 * =============================================================================
 * Command UI Interface
 * =============================================================================
 * 
 * Defines the contract for CLI command interactions (prompts, execution, display).
 * Decomposes the monolithic cli.ts execution logic.
 */

import { ICommandRegistry, TenantId } from '../../core/contracts';

export interface CommandUi {
    /**
     * The command string that triggers this UI (e.g., 'seed-google-ads')
     */
    readonly name: string;

    /**
     * Executes the command flow:
     * 1. Prompt for arguments (if interactive)
     * 2. Construct the Command object
     * 3. Execute via Registry
     * 4. Display results using IUiPrinter or console
     */
    execute(tenantId: TenantId, registry: ICommandRegistry, args?: Record<string, unknown>): Promise<void>;
}
