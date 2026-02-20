
import 'reflect-metadata';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SeedUnifiedUi } from '../commands/ui/seed-unified.ui';
import { VerifyScenarioUi } from '../commands/ui/verify-scenario.ui';
import { SeedDataUi } from '../commands/ui/seed-data.ui';
import { SeedGoogleAdsUi } from '../commands/ui/seed-google-ads.ui';
import { AlertScenarioUi } from '../commands/ui/alert-scenario.ui';
import { ResetTenantUi } from '../commands/ui/reset-tenant.ui';
import { ResetTenantHardUi } from '../commands/ui/reset-tenant-hard.ui';

describe('CLI Components Smoke Test', () => {
    it('should successfully import all UI command handlers', () => {
        assert.ok(SeedUnifiedUi, 'SeedUnifiedUi should be defined');
        assert.ok(VerifyScenarioUi, 'VerifyScenarioUi should be defined');
        assert.ok(SeedDataUi, 'SeedDataUi should be defined');
        assert.ok(SeedGoogleAdsUi, 'SeedGoogleAdsUi should be defined');
        assert.ok(AlertScenarioUi, 'AlertScenarioUi should be defined');
        assert.ok(ResetTenantUi, 'ResetTenantUi should be defined');
        assert.ok(ResetTenantHardUi, 'ResetTenantHardUi should be defined');
    });

    it('should instantiate UI handlers', () => {
        const ui = new SeedUnifiedUi();
        assert.strictEqual(ui.name, 'seed-unified-scenario');
    });
});
