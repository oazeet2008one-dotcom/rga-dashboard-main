import 'reflect-metadata';
import { container } from 'tsyringe';
import {
    loadConfiguration,
    initializeContainer,
    disposeContainer,
    ServiceLocator,
    TOKENS,
} from '../core';
import { PinoLogger } from '../infrastructure';
import { SeedUnifiedCommandHandler, SeedUnifiedCommandParams } from '../commands/seed-unified.command';
import { ScenarioLoader } from '../scenarios/scenario-loader';
import { FixtureProvider } from '../fixtures/fixture-provider';
import { OutputPathPolicyError, resolveOutputDir } from '../core/output-path-policy';

type ParsedFlags = Record<string, string | boolean>;

function parseFlags(argv: string[]): { flags: ParsedFlags; positional?: string } {
    const flags: ParsedFlags = {};
    let positional: string | undefined;

    for (const arg of argv) {
        if (arg.startsWith('--')) {
            const [key, rawValue] = arg.slice(2).split('=');
            flags[key] = rawValue === undefined ? true : rawValue;
        } else if (!positional) {
            positional = arg;
        }
    }

    return { flags, positional };
}

function readString(flags: ParsedFlags, key: string): string | undefined {
    const value = flags[key];
    return typeof value === 'string' ? value : undefined;
}

function readInt(flags: ParsedFlags, key: string, fallback: number): number {
    const value = readString(flags, key);
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

async function main(): Promise<void> {
    const { flags, positional } = parseFlags(process.argv.slice(2));

    const scenario = positional || readString(flags, 'scenario');
    const tenantId = readString(flags, 'tenant');
    const mode = (readString(flags, 'mode') || 'GENERATED') as SeedUnifiedCommandParams['mode'];

    if (!scenario || !tenantId) {
        console.error('Usage: seed-unified.ts <scenario-id> --tenant=<tenant-id> [--mode=GENERATED|FIXTURE|HYBRID] [--seed=12345] [--days=30] [--platforms=google,facebook,tiktok,line,shopee,lazada] [--no-dry-run] [--allow-real-tenant] [--manifest-dir=<dir>]');
        process.exit(2);
    }

    const commandParams: SeedUnifiedCommandParams = {
        tenant: tenantId,
        scenario,
        mode,
        seed: readInt(flags, 'seed', 12345),
        days: readInt(flags, 'days', 30),
        platforms: readString(flags, 'platforms'),
        dryRun: !Boolean(flags['no-dry-run']),
        allowRealTenant: Boolean(flags['allow-real-tenant']),
    };

    const manifestDir = readString(flags, 'manifest-dir');
    let resolvedManifestDir: string | undefined;

    try {
        resolvedManifestDir = manifestDir ? resolveOutputDir('manifest', manifestDir) : undefined;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Seed Pipeline Fatal Error: ${message}`);
        process.exit(error instanceof OutputPathPolicyError ? error.exitCode : 78);
    }

    try {
        const config = loadConfiguration();
        initializeContainer(config);

        ServiceLocator.register(TOKENS.Logger, PinoLogger);

        container.register(SeedUnifiedCommandHandler, { useClass: SeedUnifiedCommandHandler });
        container.register(ScenarioLoader, { useClass: ScenarioLoader });
        container.registerInstance(FixtureProvider, new FixtureProvider());

        const handler = container.resolve(SeedUnifiedCommandHandler);
        const result = await handler.runWithManifest(commandParams, resolvedManifestDir);

        console.log(`Seed Pipeline Status: ${result.status}`);
        console.log(`Exit Code: ${result.exitCode}`);
        if (result.manifestPath) {
            console.log(`Manifest: ${result.manifestPath}`);
        }

        const writesApplied = result.manifest?.results?.writesApplied?.actualCounts?.totalRows;
        const writesPlanned = result.manifest?.results?.writesPlanned?.estimatedCounts?.totalRows;
        if (commandParams.dryRun) {
            if (typeof writesPlanned === 'number') {
                console.log(`Rows Planned (Dry Run): ${writesPlanned}`);
            }
            console.log(`Rows Applied: ${typeof writesApplied === 'number' ? writesApplied : 0}`);
        } else if (typeof writesApplied === 'number') {
            console.log(`Rows Created: ${writesApplied}`);
        }

        process.exit(result.exitCode);
    } catch (error: any) {
        console.error(`Seed Pipeline Fatal Error: ${error?.message || String(error)}`);
        process.exit(1);
    } finally {
        await disposeContainer();
    }
}

main();
