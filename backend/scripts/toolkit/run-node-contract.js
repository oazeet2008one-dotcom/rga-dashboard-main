#!/usr/bin/env node
/*
 * Enforce toolkit runtime contract (Node 20.x) with an automatic fallback.
 * - If current runtime is Node 20.x -> execute run-direct.js directly.
 * - Otherwise -> delegate execution to `npx node@20` to satisfy contract.
 *
 * Note: For CI/test isolation (toolkit_dev schema), use run-isolated.js directly.
 */
const path = require('path');
const { spawn } = require('child_process');

const targetScript = path.resolve(__dirname, 'run-direct.js');
const forwardedArgs = process.argv.slice(2);
const major = Number.parseInt((process.versions.node || '').split('.')[0] || '', 10);
const useLocalNode = Number.isFinite(major) && major === 20;
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const resolved = useLocalNode
  ? {
    cmd: process.execPath,
    args: [targetScript, ...forwardedArgs],
  }
  : {
    cmd: NPX,
    args: ['-y', 'node@20', targetScript, ...forwardedArgs],
  };

if (!useLocalNode) {
  process.stderr.write(
    `[toolkit-runtime] Detected Node ${process.versions.node}. ` +
    'Delegating to Node 20.x via npx node@20.\n',
  );
}

function quoteForShell(value) {
  if (value === '') return '""';
  if (!/[ \t"]/u.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

const useWindowsShell = process.platform === 'win32' && resolved.cmd.endsWith('.cmd');
const child = useWindowsShell
  ? spawn(
    [resolved.cmd, ...resolved.args].map(quoteForShell).join(' '),
    {
      stdio: 'inherit',
      shell: true,
    },
  )
  : spawn(resolved.cmd, resolved.args, {
    stdio: 'inherit',
    shell: false,
  });

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
