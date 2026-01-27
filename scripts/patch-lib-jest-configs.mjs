#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LIBS_DIR = path.join(ROOT, 'libs');
const ROOT_PRESET_ABS = path.join(ROOT, 'jest.preset.js');

const DEFAULT_RN_TRANSFORM_IGNORE = `[
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context)/)',
  ]`;

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

function hasRootPresetRequire(txt) {
  return /const\s+rootPreset\s*=\s*require\(/.test(txt);
}

function injectRootPresetRequire(txt, filePath) {
  if (hasRootPresetRequire(txt)) return txt;

  const rel = path
    .relative(path.dirname(filePath), ROOT_PRESET_ABS)
    .replace(/\\/g, '/');
  const requireLine = `const rootPreset = require('${rel.startsWith('.') ? rel : './' + rel}');\n`;

  // Put it at the very top (before references/comments are fine in CJS; Nx generates require-first often anyway)
  return requireLine + txt;
}

function ensureModuleNameMapperMerged(txt) {
  // If it already merges in rootPreset, do nothing
  if (txt.includes('rootPreset.moduleNameMapper')) return txt;

  if (txt.includes('moduleNameMapper:')) {
    // Insert spread right after the opening "{"
    return txt.replace(
      /moduleNameMapper:\s*\{\s*/m,
      (m) => `${m}...(rootPreset.moduleNameMapper || {}),\n    `,
    );
  }

  // No moduleNameMapper block; add one after moduleFileExtensions (common Nx layout)
  return txt.replace(
    /(moduleFileExtensions:\s*\[[^\]]*\],\s*\n)/m,
    `$1  moduleNameMapper: { ...(rootPreset.moduleNameMapper || {}) },\n`,
  );
}

function ensureTransformIgnorePatterns(txt) {
  if (txt.includes('transformIgnorePatterns:')) return txt;

  const block = `  transformIgnorePatterns: rootPreset.transformIgnorePatterns || ${DEFAULT_RN_TRANSFORM_IGNORE},\n`;

  // Prefer inserting before "transform:" if present (keeps config readable)
  if (txt.includes('\n  transform:')) {
    return txt.replace(/\n  transform:\s*\{/m, `\n${block}  transform: {`);
  }

  // Otherwise, insert after setupFilesAfterEnv if present
  if (txt.includes('setupFilesAfterEnv:')) {
    return txt.replace(
      /(setupFilesAfterEnv:\s*\[[^\]]*\],\s*\n)/m,
      `$1${block}`,
    );
  }

  // Fallback: insert after moduleNameMapper if present
  if (txt.includes('moduleNameMapper:')) {
    return txt.replace(/(moduleNameMapper:[\s\S]*?\},\s*\n)/m, `$1${block}`);
  }

  // Last resort: append near the top
  return txt.replace(
    /(moduleFileExtensions:\s*\[[^\]]*\],\s*\n)/m,
    `$1${block}`,
  );
}

function main() {
  if (!fs.existsSync(LIBS_DIR)) {
    console.error('No libs/ directory found.');
    process.exit(1);
  }
  if (!fs.existsSync(ROOT_PRESET_ABS)) {
    console.error('No jest.preset.js found at repo root.');
    process.exit(1);
  }

  const files = listJestConfigs(LIBS_DIR);
  let patched = 0;

  for (const f of files) {
    const original = fs.readFileSync(f, 'utf8');
    let txt = original;

    // Always try to ensure these, even if rootPreset already exists
    txt = injectRootPresetRequire(txt, f);
    txt = ensureModuleNameMapperMerged(txt);
    txt = ensureTransformIgnorePatterns(txt);

    if (txt !== original) {
      fs.writeFileSync(f, txt, 'utf8');
      patched++;
    }
  }

  console.log(
    `✅ Patched ${patched} lib jest config(s) (rootPreset merge + transformIgnorePatterns).`,
  );
}

main();
