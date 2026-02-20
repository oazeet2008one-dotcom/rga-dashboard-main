#!/usr/bin/env node
/*
 * Execute toolkit commands directly against the DATABASE_URL from .env.
 * No schema isolation — connects to the default (public) schema.
 *
 * This is the simplified launcher for DEV use. For CI/test isolation,
 * use run-isolated.js instead (which creates a separate toolkit_dev schema).
 */
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ROOT = path.resolve(__dirname, '..', '..');
const NODE = process.execPath;
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const alias = process.argv[2];
const extraArgs = process.argv.slice(3);

function fail(message) {
    console.error(`[toolkit-direct] ${message}`);
    process.exit(1);
}

function assertSupportedNodeVersion() {
    const detected = process.versions.node || '';
    const major = Number.parseInt(detected.split('.')[0] || '', 10);
    const requiredMajor = 20;
    if (!Number.isFinite(major) || major !== requiredMajor) {
        fail(
            `Unsupported Node.js runtime ${detected}. ` +
            `Toolkit commands require Node ${requiredMajor}.x (see .nvmrc).`,
        );
    }
}

function maskHost(urlText) {
    try {
        const host = new URL(urlText).hostname;
        if (host.length <= 10) return host;
        return `${host.slice(0, 4)}***${host.slice(-4)}`;
    } catch {
        return 'invalid-host';
    }
}

function resolveCommand(selectedAlias, args) {
    switch (selectedAlias) {
        case 'prisma-migrate-deploy':
            return { cmd: NPX, args: ['prisma', 'migrate', 'deploy'] };
        case 'prisma-migrate-status':
            return { cmd: NPX, args: ['prisma', 'migrate', 'status'] };
        case 'check-schema-parity':
            return {
                cmd: NODE,
                args: ['--require', 'ts-node/register/transpile-only', 'src/scripts/toolkit/check-schema-parity.ts'],
            };
        case 'check-overview-contract':
            return {
                cmd: NODE,
                args: ['--require', 'ts-node/register/transpile-only', 'src/scripts/toolkit/check-overview-contract.ts'],
            };
        case 'preflight':
            return {
                cmd: NODE,
                args: ['--require', 'ts-node/register/transpile-only', 'src/scripts/toolkit/preflight.ts'],
            };
        case 'bootstrap-tenant':
            return {
                cmd: NODE,
                args: ['--require', 'ts-node/register/transpile-only', 'src/scripts/toolkit/bootstrap-tenant.ts', ...args],
            };
        case 'seed-scenario':
            return {
                cmd: NODE,
                args: ['--require', 'ts-node/register/transpile-only', 'src/toolkit/scripts/seed-unified.ts', ...args],
            };
        case 'verify-scenario':
            return {
                cmd: NODE,
                args: ['--require', 'ts-node/register/transpile-only', 'src/toolkit/scripts/verify.ts', ...args],
            };
        case 'toolkit-cli':
            return {
                cmd: NODE,
                args: ['--require', 'ts-node/register/transpile-only', 'src/toolkit/cli.ts', ...args],
            };
        default:
            fail(
                `Unknown alias "${selectedAlias}". Supported: prisma-migrate-deploy, prisma-migrate-status, ` +
                `check-schema-parity, check-overview-contract, preflight, bootstrap-tenant, seed-scenario, verify-scenario, toolkit-cli.`,
            );
    }
}

function main() {
    assertSupportedNodeVersion();

    if (!alias) {
        fail('Usage: node scripts/toolkit/run-direct.js <alias> [...args]');
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        fail('DATABASE_URL is required. Check your .env file.');
    }

    console.log(
        `[toolkit-direct] host=${maskHost(databaseUrl)} schema=public alias=${alias}`,
    );

    const resolved = resolveCommand(alias, extraArgs);
    const child = spawn(resolved.cmd, resolved.args, {
        cwd: ROOT,
        stdio: 'inherit',
        shell: process.platform === 'win32' && resolved.cmd.endsWith('.cmd'),
        env: {
            ...process.env,
            // DATABASE_URL is already set from .env — no modification needed
        },
    });

    child.on('exit', (code) => {
        process.exit(code ?? 1);
    });
}

main();
