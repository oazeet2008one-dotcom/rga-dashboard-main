#!/usr/bin/env node
/*
 * Reproducible local smoke flow for toolkit:
 * preflight -> bootstrap -> seed -> verify -> overview contract.
 *
 * This script forces backend runtime to the same isolated schema used by
 * toolkit commands to avoid false failures from schema mismatch.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_TENANT_SLUG = 'toolkit-ci-smoke';
const DEFAULT_TENANT_NAME = 'Toolkit CI Smoke';
const DEFAULT_SCENARIO = 'baseline';
const DEFAULT_HEALTH_URL = 'http://localhost:3000/health';
const DEFAULT_HEALTH_CHECK_RETRIES = 30;
const DEFAULT_HEALTH_CHECK_INTERVAL_MS = 2000;
const DEFAULT_LOG_DIR = path.resolve(process.cwd(), 'tmp');
const DEFAULT_SERVER_STDOUT_LOG = path.join(DEFAULT_LOG_DIR, 'backend-smoke.log');
const DEFAULT_SERVER_STDERR_LOG = path.join(DEFAULT_LOG_DIR, 'backend-smoke.err.log');
const DEFAULT_MAX_SERVER_LOG_BYTES = 5 * 1024 * 1024;
const DEFAULT_REPORT_DIR = path.resolve(process.cwd(), 'artifacts', 'reports');
const DEFAULT_REPORT_PATH = path.join(DEFAULT_REPORT_DIR, 'toolkit-smoke-report.json');

function parseArgs(argv) {
  const flags = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, rawValue] = arg.slice(2).split('=');
    flags[key] = rawValue === undefined ? true : rawValue;
  }
  return flags;
}

function readFlag(flags, key, fallback) {
  const value = flags[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function withSchema(urlText, schema) {
  const parsed = new URL(urlText);
  parsed.searchParams.set('schema', schema);
  return parsed.toString();
}

function parseMaxLogBytes(rawValue) {
  if (!rawValue) return DEFAULT_MAX_SERVER_LOG_BYTES;
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_SERVER_LOG_BYTES;
  }
  return parsed;
}

function parsePositiveInt(rawValue, fallback) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function assertFileSizeWithinLimit(filePath, maxBytes, label) {
  if (!fs.existsSync(filePath)) return;
  const { size } = fs.statSync(filePath);
  if (size > maxBytes) {
    throw new Error(
      `${label} log exceeds limit (${size} bytes > ${maxBytes} bytes): ${filePath}`,
    );
  }
}

function getFileSize(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  return fs.statSync(filePath).size;
}

function elapsedMs(startedAt) {
  return Date.now() - startedAt;
}

function createServerRuntimeCommand(distEntry) {
  const major = Number.parseInt((process.versions.node || '').split('.')[0] || '', 10);
  if (Number.isFinite(major) && major === 20) {
    return {
      cmd: process.execPath,
      args: [distEntry],
      shell: false,
    };
  }

  if (process.platform === 'win32') {
    const escapedDist = distEntry.replace(/"/g, '\\"');
    return {
      cmd: `npx.cmd -y node@20 "${escapedDist}"`,
      args: [],
      shell: true,
    };
  }

  return {
    cmd: 'npx',
    args: ['-y', 'node@20', distEntry],
    shell: false,
  };
}

function runProcess(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: Boolean(opts.shell),
      env: opts.env || process.env,
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runBestEffortProcess(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: 'ignore',
      shell: false,
    });
    child.on('exit', () => resolve());
    child.on('error', () => resolve());
  });
}

async function terminateServerProcessTree(server) {
  if (!server || !server.pid) {
    return;
  }

  if (process.platform === 'win32') {
    await runBestEffortProcess('taskkill', ['/PID', String(server.pid), '/T', '/F']);
    return;
  }

  try {
    process.kill(server.pid, 'SIGTERM');
  } catch {}
  await wait(1000);
  try {
    process.kill(server.pid, 'SIGKILL');
  } catch {}
}

function finalizeLogStreams(server, stdoutLogStream, stderrLogStream) {
  return new Promise((resolve) => {
    try {
      if (server && server.stdout) {
        server.stdout.unpipe(stdoutLogStream);
      }
      if (server && server.stderr) {
        server.stderr.unpipe(stderrLogStream);
      }
    } catch {}

    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending <= 0) {
        resolve();
      }
    };

    stdoutLogStream.on('finish', done);
    stderrLogStream.on('finish', done);
    stdoutLogStream.end();
    stderrLogStream.end();
  });
}

async function runToolkitAlias(alias, aliasArgs = [], env = process.env) {
  const startedAt = Date.now();
  const contractScript = path.resolve(process.cwd(), 'scripts/toolkit/run-node-contract.js');
  const code = await runProcess(process.execPath, [contractScript, alias, ...aliasArgs], {
    env,
    shell: false,
  });
  if (code !== 0) {
    throw new Error(`Alias "${alias}" failed with exit code ${code}.`);
  }
  return elapsedMs(startedAt);
}

async function waitForHealthy(url) {
  const retries = parsePositiveInt(
    process.env.TOOLKIT_SMOKE_HEALTH_RETRIES,
    DEFAULT_HEALTH_CHECK_RETRIES,
  );
  const intervalMs = parsePositiveInt(
    process.env.TOOLKIT_SMOKE_HEALTH_INTERVAL_MS,
    DEFAULT_HEALTH_CHECK_INTERVAL_MS,
  );

  function requestOnce() {
    return new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  for (let i = 0; i < retries; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await requestOnce();
    if (ok) return;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    `Backend health check timeout at ${url} ` +
      `after ${retries} retries x ${intervalMs}ms.`,
  );
}

async function startServerAndCheckOverview({ tenantSlug, schema }) {
  const baseDb = process.env.TOOLKIT_ISOLATED_DATABASE_URL || process.env.DATABASE_URL;
  const baseDirect = process.env.TOOLKIT_ISOLATED_DIRECT_URL || process.env.DIRECT_URL || baseDb;
  if (!baseDb) {
    throw new Error('DATABASE_URL is required.');
  }

  const serverEnv = {
    ...process.env,
    DATABASE_URL: withSchema(baseDb, schema),
    DIRECT_URL: withSchema(baseDirect, schema),
  };

  const distEntry = path.resolve(process.cwd(), 'dist/src/main.js');
  if (!fs.existsSync(distEntry)) {
    throw new Error('Missing build artifact dist/src/main.js. Run "npm run build" first.');
  }

  fs.mkdirSync(DEFAULT_LOG_DIR, { recursive: true });
  const stdoutLogStream = fs.createWriteStream(DEFAULT_SERVER_STDOUT_LOG, { flags: 'w' });
  const stderrLogStream = fs.createWriteStream(DEFAULT_SERVER_STDERR_LOG, { flags: 'w' });
  const maxServerLogBytes = parseMaxLogBytes(process.env.TOOLKIT_SMOKE_MAX_SERVER_LOG_BYTES);

  const serverRuntime = createServerRuntimeCommand(distEntry);
  const server = spawn(serverRuntime.cmd, serverRuntime.args, {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: serverRuntime.shell,
    env: serverEnv,
  });
  server.stdout.pipe(stdoutLogStream);
  server.stderr.pipe(stderrLogStream);

  try {
    await waitForHealthy(DEFAULT_HEALTH_URL);
    const overviewCheckMs = await runToolkitAlias('check-overview-contract', [], {
      ...process.env,
      TOOLKIT_CHECK_TENANT_SLUG: tenantSlug,
    });
    return { overviewCheckMs };
  } finally {
    await terminateServerProcessTree(server);
    await finalizeLogStreams(server, stdoutLogStream, stderrLogStream);
    assertFileSizeWithinLimit(DEFAULT_SERVER_STDOUT_LOG, maxServerLogBytes, 'stdout');
    assertFileSizeWithinLimit(DEFAULT_SERVER_STDERR_LOG, maxServerLogBytes, 'stderr');
  }
}

function writeSmokeReport(payload) {
  fs.mkdirSync(DEFAULT_REPORT_DIR, { recursive: true });
  fs.writeFileSync(DEFAULT_REPORT_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

async function main() {
  const overallStartedAt = Date.now();
  const flags = parseArgs(process.argv.slice(2));
  const tenantId = readFlag(flags, 'tenant-id', DEFAULT_TENANT_ID);
  const tenantSlug = readFlag(flags, 'tenant-slug', DEFAULT_TENANT_SLUG);
  const tenantName = readFlag(flags, 'tenant-name', DEFAULT_TENANT_NAME);
  const scenario = readFlag(flags, 'scenario', DEFAULT_SCENARIO);
  const isolatedSchema = readFlag(
    flags,
    'schema',
    process.env.TOOLKIT_ISOLATED_SCHEMA || 'toolkit_dev',
  );

  console.log(`[toolkit-smoke] tenant=${tenantId} slug=${tenantSlug} scenario=${scenario} schema=${isolatedSchema}`);

  const preflightMs = await runToolkitAlias('preflight');
  const bootstrapMs = await runToolkitAlias('bootstrap-tenant', [
    `--id=${tenantId}`,
    `--slug=${tenantSlug}`,
    `--name=${tenantName}`,
  ]);
  const seedMs = await runToolkitAlias('seed-scenario', [
    scenario,
    `--tenant=${tenantId}`,
    '--no-dry-run',
  ]);
  const verifyMs = await runToolkitAlias('verify-scenario', [
    scenario,
    `--tenant=${tenantId}`,
    '--no-dry-run',
  ]);
  const overviewResult = await startServerAndCheckOverview({
    tenantSlug,
    schema: isolatedSchema,
  });

  const stdoutLogBytes = getFileSize(DEFAULT_SERVER_STDOUT_LOG);
  const stderrLogBytes = getFileSize(DEFAULT_SERVER_STDERR_LOG);
  const totalMs = elapsedMs(overallStartedAt);

  writeSmokeReport({
    checkedAt: new Date().toISOString(),
    status: 'PASS',
    tenantId,
    tenantSlug,
    scenario,
    schema: isolatedSchema,
    durationsMs: {
      preflight: preflightMs,
      bootstrap: bootstrapMs,
      seed: seedMs,
      verify: verifyMs,
      overview: overviewResult?.overviewCheckMs ?? null,
      total: totalMs,
    },
    logs: {
      stdoutPath: DEFAULT_SERVER_STDOUT_LOG,
      stderrPath: DEFAULT_SERVER_STDERR_LOG,
      stdoutBytes: stdoutLogBytes,
      stderrBytes: stderrLogBytes,
      maxBytes: parseMaxLogBytes(process.env.TOOLKIT_SMOKE_MAX_SERVER_LOG_BYTES),
    },
  });

  console.log('[toolkit-smoke] PASS');
  console.log(`[toolkit-smoke] report=${DEFAULT_REPORT_PATH}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  try {
    writeSmokeReport({
      checkedAt: new Date().toISOString(),
      status: 'FAIL',
      error: message,
    });
  } catch {}
  console.error(`[toolkit-smoke] FAIL: ${message}`);
  console.error(`[toolkit-smoke] report=${DEFAULT_REPORT_PATH}`);
  process.exit(1);
});
