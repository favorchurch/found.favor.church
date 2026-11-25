/** Run only offline Node tests. No Jest workers, service clients, or credentials. */
import { readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tier = process.argv[2];
if (!['unit', 'full'].includes(tier) || process.argv.length !== 3) {
  console.error('Usage: node scripts/run-tests.mjs <unit|full>');
  process.exit(2);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testsRoot = join(root, 'tests');
const sourceRoot = join(root, 'src');
const externalSuites = new Set(['live', 'e2e']);
const testFile = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

function discover(dir, relativeParts = []) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const parts = [...relativeParts, entry.name];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Live-service and browser suites are never part of default offline gates.
      if (parts.length === 1 && externalSuites.has(entry.name)) return [];
      return discover(path, parts);
    }
    if (!entry.isFile() || !testFile.test(entry.name)) return [];
    if (tier === 'unit' && parts.length > 1 && parts[0] !== 'unit') return [];
    return [path];
  });
}

const files = [
  ...discover(testsRoot),
  ...(tier === 'full' ? discover(sourceRoot) : []),
].sort();
if (files.length === 0) {
  console.error('No ' + tier + ' test files discovered; refusing an empty green gate.');
  process.exit(2);
}

console.log('[test:' + tier + '] ' + files.length + ' offline test files: ' + files.map((f) => relative(root, f).split(sep).join('/')).join(', '));
const command = [
  '--experimental-strip-types',
  '--experimental-vm-modules',
  '--test',
  ...files,
];
// Never forward ambient Supabase, Google, Zoom, Rock, or other credentials.
const safeEnv = {
  PATH: process.env.PATH ?? '',
  HOME: process.env.HOME ?? '/tmp',
  NODE_ENV: 'test',
  LANG: 'C',
};
const result = spawnSync(process.execPath, command, {
  cwd: root,
  env: safeEnv,
  stdio: 'inherit',
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
