#!/usr/bin/env node
/**
 * Local CI-parity gate runner for Toolkit.
 *
 * Runs backend + frontend quality gates in deterministic order and writes
 * a machine-readable report for GO/NO-GO decisions.
 */

const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const NPX_BIN = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const COREPACK_BIN = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';
const DEFAULT_REPORT_PATH = path.resolve(
  process.cwd(),
  'tmp',
  'e2e-reports',
  'toolkit-quality-gates-report.json',
);

function parseArgs(argv) {
  const flags = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.slice(2).split('=');
    flags[k] = v === undefined ? true : v;
  }
  return flags;
}

function elapsedMs(startedAt) {
  return Date.now() - startedAt;
}

function spawnStep(step) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const useWindowsShell = process.platform === 'win32' && step.cmd.toLowerCase().endsWith('.cmd');
    const cmd = useWindowsShell ? `${step.cmd} ${step.args.join(' ')}` : step.cmd;
    const args = useWindowsShell ? [] : step.args;
    const child = spawn(cmd, args, {
      cwd: step.cwd || process.cwd(),
      stdio: 'inherit',
      shell: useWindowsShell,
      env: { ...process.env, ...(step.env || {}) },
    });
    child.on('exit', (code) => {
      resolve({
        id: step.id,
        label: step.label,
        command: `${step.cmd} ${step.args.join(' ')}`,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: elapsedMs(startedAt),
        exitCode: code ?? 1,
        status: code === 0 ? 'PASS' : 'FAIL',
      });
    });
  });
}

function writeReport(reportPath, report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
}

function isLocalPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (error) => {
      if (error && error.code === 'EADDRINUSE') {
        resolve(true);
        return;
      }
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '127.0.0.1');
  });
}

function getSmokeArgs() {
  const tenantId = process.env.TOOLKIT_SMOKE_TENANT_ID || '11111111-1111-1111-1111-111111111111';
  const tenantSlug = process.env.TOOLKIT_SMOKE_TENANT_SLUG || 'toolkit-ci-smoke';
  const tenantName = process.env.TOOLKIT_SMOKE_TENANT_NAME || 'Toolkit CI Smoke';
  const scenario = process.env.TOOLKIT_SMOKE_SCENARIO || 'baseline';
  return [
    '--',
    `--tenant-id=${tenantId}`,
    `--tenant-slug=${tenantSlug}`,
    `--tenant-name=${tenantName}`,
    `--scenario=${scenario}`,
  ];
}

function buildSteps({ skipSmoke, skipFrontend }) {
  const backendSteps = [
    {
      id: 'backend.isolated_migrate',
      label: 'Backend isolated migrate',
      cmd: NPM_BIN,
      args: ['--prefix', 'backend', 'run', 'toolkit:isolated:migrate'],
    },
    {
      id: 'backend.schema_parity',
      label: 'Backend schema parity',
      cmd: NPM_BIN,
      args: ['--prefix', 'backend', 'run', 'toolkit:check:schema-parity'],
    },
    {
      id: 'backend.typecheck',
      label: 'Backend typecheck',
      cmd: NPX_BIN,
      args: ['tsc', '--noEmit'],
      cwd: path.resolve(process.cwd(), 'backend'),
    },
    {
      id: 'backend.build',
      label: 'Backend build',
      cmd: NPM_BIN,
      args: ['--prefix', 'backend', 'run', 'build'],
    },
    {
      id: 'backend.toolkit_test',
      label: 'Backend manifest tests',
      cmd: NPM_BIN,
      args: ['--prefix', 'backend', 'run', 'toolkit:test'],
    },
    {
      id: 'backend.phase2',
      label: 'Backend phase2 tests',
      cmd: NPM_BIN,
      args: ['--prefix', 'backend', 'run', 'toolkit:test:phase2'],
    },
    {
      id: 'backend.phase3',
      label: 'Backend phase3 tests',
      cmd: NPM_BIN,
      args: ['--prefix', 'backend', 'run', 'toolkit:test:phase3'],
    },
    {
      id: 'backend.phase4b',
      label: 'Backend phase4b tests',
      cmd: NPM_BIN,
      args: ['--prefix', 'backend', 'run', 'toolkit:test:phase4b'],
    },
  ];

  if (!skipSmoke) {
    backendSteps.push({
      id: 'backend.smoke',
      label: 'Backend toolkit smoke',
      cmd: NPM_BIN,
      args: ['--prefix', 'backend', 'run', 'toolkit:smoke', ...getSmokeArgs()],
      env: {
        TOOLKIT_SMOKE_HEALTH_RETRIES: process.env.TOOLKIT_SMOKE_HEALTH_RETRIES || '90',
        TOOLKIT_SMOKE_HEALTH_INTERVAL_MS: process.env.TOOLKIT_SMOKE_HEALTH_INTERVAL_MS || '2000',
      },
    });
  }

  if (skipFrontend) {
    return backendSteps;
  }

  return backendSteps.concat([
    {
      id: 'frontend.typecheck',
      label: 'Frontend typecheck',
      cmd: COREPACK_BIN,
      args: ['pnpm', '--dir', 'frontend', 'check'],
    },
    {
      id: 'frontend.unit_contract',
      label: 'Frontend unit contract tests',
      cmd: COREPACK_BIN,
      args: ['pnpm', '--dir', 'frontend', 'test:unit'],
    },
    {
      id: 'frontend.build',
      label: 'Frontend build',
      cmd: COREPACK_BIN,
      args: ['pnpm', '--dir', 'frontend', 'build'],
    },
    {
      id: 'frontend.bundle_budget',
      label: 'Frontend bundle budget',
      cmd: COREPACK_BIN,
      args: ['pnpm', '--dir', 'frontend', 'perf:bundle:check'],
    },
  ]);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const skipSmoke = flags['skip-smoke'] === true;
  const skipFrontend = flags['skip-frontend'] === true || flags['backend-only'] === true;
  const allowBusyPort3000 = flags['allow-busy-port-3000'] === true;
  const reportPath =
    typeof flags.report === 'string' && flags.report.trim().length > 0
      ? path.resolve(process.cwd(), flags.report.trim())
      : DEFAULT_REPORT_PATH;

  const startedAt = Date.now();
  const steps = buildSteps({ skipSmoke, skipFrontend });
  const results = [];

  if (!skipSmoke && !allowBusyPort3000) {
    // Smoke launches backend on :3000; fail fast when port is already occupied.
    const portBusy = await isLocalPortInUse(3000);
    if (portBusy) {
      const report = {
        checkedAt: new Date().toISOString(),
        status: 'FAIL',
        durationMs: elapsedMs(startedAt),
        reportVersion: '1.0.0',
        options: { skipSmoke, skipFrontend, allowBusyPort3000 },
        error:
          'Port 3000 is already in use. Stop the running process or rerun with --allow-busy-port-3000.',
        steps: [],
      };
      writeReport(reportPath, report);
      console.error('[toolkit-quality] FAIL: Port 3000 is already in use.');
      console.error('[toolkit-quality] Stop the running process, then rerun toolkit:quality-gates.');
      console.error(`[toolkit-quality] report=${reportPath}`);
      process.exit(1);
    }
  }

  console.log('[toolkit-quality] Starting local CI-parity quality gates...');
  console.log(`[toolkit-quality] Steps: ${steps.length}`);

  for (const step of steps) {
    console.log(`\n[toolkit-quality] RUN ${step.label}`);
    // eslint-disable-next-line no-await-in-loop
    const result = await spawnStep(step);
    results.push(result);
    if (result.exitCode !== 0) {
      const report = {
        checkedAt: new Date().toISOString(),
        status: 'FAIL',
        durationMs: elapsedMs(startedAt),
        reportVersion: '1.0.0',
        options: { skipSmoke, skipFrontend, allowBusyPort3000 },
        steps: results,
      };
      writeReport(reportPath, report);
      console.error(`\n[toolkit-quality] FAIL at step "${step.label}"`);
      console.error(`[toolkit-quality] report=${reportPath}`);
      process.exit(1);
    }
    console.log(`[toolkit-quality] PASS ${step.label} (${result.durationMs} ms)`);
  }

  const report = {
    checkedAt: new Date().toISOString(),
    status: 'PASS',
    durationMs: elapsedMs(startedAt),
    reportVersion: '1.0.0',
    options: { skipSmoke, skipFrontend, allowBusyPort3000 },
    steps: results,
  };
  writeReport(reportPath, report);

  console.log('\n[toolkit-quality] PASS');
  console.log(`[toolkit-quality] report=${reportPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[toolkit-quality] FAIL: ${message}`);
  process.exit(1);
});
