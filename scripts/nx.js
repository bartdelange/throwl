const { spawnSync } = require('node:child_process');
const path = require('node:path');

const args = process.argv.slice(2);
const isNativeVersionSync = args.some((arg) =>
  arg.includes('syncNativeVersions'),
);
const forwardedArgs = isNativeVersionSync
  ? args.map((arg) => (arg.startsWith('--version=') ? `--args=${arg}` : arg))
  : args;
const nx = path.join(__dirname, '..', 'node_modules', 'nx', 'bin', 'nx.js');
const result = spawnSync(process.execPath, [nx, ...forwardedArgs], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
