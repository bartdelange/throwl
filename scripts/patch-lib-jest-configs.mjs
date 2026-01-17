#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LIBS_DIR = path.join(ROOT, 'libs');

function listJestConfigs(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && /^jest\.config\.(js|cjs|ts|cts|mjs)$/.test(e.name))
        out.push(full);
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(LIBS_DIR)) {
    console.error('No libs/ directory found.');
    process.exit(1);
  }

  const files = listJestConfigs(LIBS_DIR);
  let patched = 0;

  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');

    // If it already requires rootPreset, skip
    if (
      txt.includes('rootPreset = require(') ||
      txt.includes('require("../../jest.preset"') ||
      txt.includes("require('../../../jest.preset")
    ) {
      continue;
    }

    // Compute relative path from this config to root jest.preset
    const rel = path
      .relative(path.dirname(f), path.join(ROOT, 'jest.preset.js'))
      .replace(/\\/g, '/');
    const requireLine = `const rootPreset = require('${rel.startsWith('.') ? rel : './' + rel}');\n`;

    // Inject require at top and merge moduleNameMapper if present.
    // This is a heuristic patcher; it’s meant to work with your generated Nx configs.
    let patchedTxt = requireLine + txt;

    // If moduleNameMapper exists, merge it; otherwise add it.
    if (patchedTxt.includes('moduleNameMapper:')) {
      patchedTxt = patchedTxt.replace(
        /moduleNameMapper:\s*\{/,
        'moduleNameMapper: {\n    ...(rootPreset.moduleNameMapper || {}),',
      );
    } else {
      patchedTxt = patchedTxt.replace(
        /moduleFileExtensions:\s*\[[^\]]*\],\s*\n/,
        (m) =>
          m +
          '  moduleNameMapper: { ...(rootPreset.moduleNameMapper || {}) },\n',
      );
    }

    fs.writeFileSync(f, patchedTxt, 'utf8');
    patched++;
  }

  console.log(
    `✅ Patched ${patched} lib jest config(s) to include rootPreset.moduleNameMapper`,
  );
}

main();
