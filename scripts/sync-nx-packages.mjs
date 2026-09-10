#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const libsDirectory = path.join(process.cwd(), 'libs');
const sourceCondition = '@throwl/source';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function findProjectFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findProjectFiles(entryPath);
    return entry.isFile() && entry.name === 'project.json' ? [entryPath] : [];
  });
}

function ensurePackage(projectFile, importPath) {
  const projectRoot = path.dirname(projectFile);
  const packageFile = path.join(projectRoot, 'package.json');
  const original = fs.existsSync(packageFile)
    ? fs.readFileSync(packageFile, 'utf8')
    : null;
  const packageJson = original ? JSON.parse(original) : {};

  packageJson.name = importPath;
  packageJson.version ??= '0.0.0';
  packageJson.types = './src/index.ts';
  packageJson.exports ??= {};
  packageJson.exports['.'] = {
    ...(packageJson.exports['.'] ?? {}),
    types: './src/index.ts',
    [sourceCondition]: './src/index.ts',
    default: './src/index.ts',
    'react-native': './src/index.ts',
  };
  packageJson.private = true;

  const normalized = `${JSON.stringify(packageJson, null, 2)}\n`;
  if (normalized === original) return 'unchanged';

  fs.writeFileSync(packageFile, normalized, 'utf8');
  return original === null ? 'created' : 'updated';
}

function ensureIndex(projectFile) {
  const indexFile = path.join(path.dirname(projectFile), 'src', 'index.ts');
  if (fs.existsSync(indexFile)) return false;

  fs.mkdirSync(path.dirname(indexFile), { recursive: true });
  fs.writeFileSync(indexFile, '// Public API\n', 'utf8');
  return true;
}

const projectFiles = findProjectFiles(libsDirectory);
if (projectFiles.length === 0) {
  console.error('No libs/**/project.json found. Nothing to sync.');
  process.exit(1);
}

const packageResults = { created: 0, updated: 0, unchanged: 0 };
let indexesCreated = 0;

for (const projectFile of projectFiles) {
  const project = readJson(projectFile);
  const importPath =
    project.importPath ??
    (typeof project.name === 'string' && project.name.startsWith('@throwl/')
      ? project.name
      : null);

  if (!importPath) continue;
  packageResults[ensurePackage(projectFile, importPath)]++;
  if (ensureIndex(projectFile)) indexesCreated++;
}

console.log(
  `Synced library packages (created ${packageResults.created}, updated ${packageResults.updated}, unchanged ${packageResults.unchanged}).`,
);
console.log(`Ensured public entry points (created ${indexesCreated}).`);
