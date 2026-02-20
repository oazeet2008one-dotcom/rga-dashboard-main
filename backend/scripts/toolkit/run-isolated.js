#!/usr/bin/env node
/*
 * Execute toolkit/prisma commands against an isolated PostgreSQL schema.
 * This avoids drift from shared DEV jobs that mutate the default/public schema.
 */
const path = require('path');
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ROOT = path.resolve(__dirname, '..', '..');
const NODE = process.execPath;
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const alias = process.argv[2];
const extraArgs = process.argv.slice(3);

function fail(message) {
  console.error(`[toolkit-isolated] ${message}`);
  process.exit(1);
}

function assertSupportedNodeVersion() {
  const detected = process.versions.node || '';
  const major = Number.parseInt(detected.split('.')[0] || '', 10);
  const requiredMajor = 20;
  if (!Number.isFinite(major) || major !== requiredMajor) {
    fail(
      `Unsupported Node.js runtime ${detected}. ` +
        `Toolkit isolated commands require Node ${requiredMajor}.x (see .nvmrc).`,
    );
  }
}

function requirePgUrl(value, name) {
  if (!value) fail(`${name} is required.`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${name} is not a valid URL.`);
  }
  if (!parsed.protocol.startsWith('postgres')) {
    fail(`${name} must be a postgresql:// URL.`);
  }
  return parsed;
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

function applySchema(urlText, schema) {
  const parsed = new URL(urlText);
  parsed.searchParams.set('schema', schema);
  return parsed.toString();
}

function validateSchemaName(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

async function ensureSchemaExists(baseDatabaseUrl, schema) {
  const prisma = new PrismaClient({
    datasources: { db: { url: baseDatabaseUrl } },
  });

  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  } finally {
    await prisma.$disconnect();
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

async function main() {
  assertSupportedNodeVersion();

  if (!alias) {
    fail('Usage: node scripts/toolkit/run-isolated.js <alias> [...args]');
  }

  const isolatedSchema = process.env.TOOLKIT_ISOLATED_SCHEMA || 'toolkit_dev';
  if (!validateSchemaName(isolatedSchema)) {
    fail(`Invalid TOOLKIT_ISOLATED_SCHEMA "${isolatedSchema}". Use [A-Za-z_][A-Za-z0-9_]*.`);
  }
  if (isolatedSchema.toLowerCase() === 'public') {
    fail('TOOLKIT_ISOLATED_SCHEMA cannot be "public". Use a dedicated isolated schema.');
  }

  const baseDatabaseUrl = process.env.TOOLKIT_ISOLATED_DATABASE_URL || process.env.DATABASE_URL;
  const baseDirectUrl = process.env.TOOLKIT_ISOLATED_DIRECT_URL || process.env.DIRECT_URL || baseDatabaseUrl;

  const parsedDb = requirePgUrl(baseDatabaseUrl, 'DATABASE_URL');
  requirePgUrl(baseDirectUrl, 'DIRECT_URL');

  await ensureSchemaExists(parsedDb.toString(), isolatedSchema);

  const isolatedDatabaseUrl = applySchema(baseDatabaseUrl, isolatedSchema);
  const isolatedDirectUrl = applySchema(baseDirectUrl, isolatedSchema);

  console.log(
    `[toolkit-isolated] host=${maskHost(isolatedDatabaseUrl)} schema=${isolatedSchema} alias=${alias}`,
  );

  const resolved = resolveCommand(alias, extraArgs);
  const child = spawn(resolved.cmd, resolved.args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32' && resolved.cmd.endsWith('.cmd'),
    env: {
      ...process.env,
      DATABASE_URL: isolatedDatabaseUrl,
      DIRECT_URL: isolatedDirectUrl,
    },
  });

  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(`Fatal error: ${message}`);
});
