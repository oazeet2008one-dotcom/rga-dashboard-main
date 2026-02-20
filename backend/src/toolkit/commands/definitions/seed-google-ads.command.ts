/**
 * =============================================================================
 * Seed Google Ads Command (Definition)
 * =============================================================================
 * 
 * Command object representing user intent to seed Google Ads historical data.
 * This is just data - no logic here (CQS principle).
 * =============================================================================
 */

import { ICommand, CommandName } from '../../core/contracts';

export const SEED_GOOGLE_ADS_COMMAND = 'seed-google-ads' as CommandName;

export interface SeedGoogleAdsCommand extends ICommand {
    readonly name: typeof SEED_GOOGLE_ADS_COMMAND;
    readonly tenantId: string;
    readonly days: number;
}

export function createSeedGoogleAdsCommand(
    tenantId: string,
    days: number = 30
): SeedGoogleAdsCommand {
    return {
        name: SEED_GOOGLE_ADS_COMMAND,
        description: 'Seed 30 days of historical Google Ads data',
        requiresConfirmation: false,
        tenantId,
        days,
    };
}
