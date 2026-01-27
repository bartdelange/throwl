import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE_ROOT = process.cwd();
const PROJECT_JSON_NAME = 'project.json';

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function findProjectJsonFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip common heavy folders
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git'
      )
        continue;
      out.push(...findProjectJsonFiles(full));
    } else if (entry.isFile() && entry.name === PROJECT_JSON_NAME) {
      out.push(full);
    }
  }
  return out;
}

function pickTsConfig(projectRootAbs) {
  // Prefer a dedicated typecheck config if you want one later
  const candidates = [
    'tsconfig.typecheck.json',
    'tsconfig.lib.json',
    'tsconfig.app.json',
    'tsconfig.json',
  ];
  for (const c of candidates) {
    const abs = path.join(projectRootAbs, c);
    if (exists(abs)) return c;
  }
  return null;
}

const rootsToScan = ['apps', 'libs']
  .map((r) => path.join(WORKSPACE_ROOT, r))
  .filter(exists);

if (rootsToScan.length === 0) {
  console.error('No apps/ or libs/ folder found.');
  process.exit(1);
}

const projectJsonFiles = rootsToScan.flatMap(findProjectJsonFiles);

let changed = 0;
for (const file of projectJsonFiles) {
  const projectRootAbs = path.dirname(file);
  const projectRootRel = path
    .relative(WORKSPACE_ROOT, projectRootAbs)
    .replaceAll('\\', '/');

  const raw = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(raw);

  json.targets ??= {};

  // If a project already defines typecheck, leave it alone
  if (json.targets.typecheck) continue;

  const tsconfig = pickTsConfig(projectRootAbs);
  if (!tsconfig) {
    console.warn(`Skipping ${projectRootRel}: no tsconfig found`);
    continue;
  }

  json.targets.typecheck = {
    executor: 'nx:run-commands',
    outputs: [],
    options: {
      cwd: '{workspaceRoot}',
      command: `tsc -p ./${projectRootRel}/${tsconfig} --noEmit`,
    },
  };

  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
  changed++;
}

console.log(`✅ Added typecheck to ${changed} project(s).`);
