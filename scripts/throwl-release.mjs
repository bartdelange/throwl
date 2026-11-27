import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  draftTemplate,
  readStoreNotes,
  withDraftStatus,
} from './store-release.mjs';

const directory = await mkdtemp(join(tmpdir(), 'throwl-release-'));
try {
  const suppliedNotes = process.env.THROWL_RELEASE_NOTES_FILE;
  const notesPath = suppliedNotes
    ? resolve(suppliedNotes)
    : join(directory, 'release-notes.md');
  if (!suppliedNotes) {
    if (!process.stdin.isTTY) {
      throw new Error(
        'Run the release in an interactive terminal or set THROWL_RELEASE_NOTES_FILE.',
      );
    }
    await writeFile(notesPath, draftTemplate());
    const editor = process.env.VISUAL || process.env.EDITOR || 'vi';
    execFileSync(
      'sh',
      ['-c', `exec ${editor} "$1"`, 'release-editor', notesPath],
      {
        stdio: 'inherit',
      },
    );
  }

  const body = await readFile(notesPath, 'utf8');
  readStoreNotes(body);
  const draftPath = join(directory, 'draft.md');
  await writeFile(draftPath, withDraftStatus(body));

  const token =
    process.env.GITHUB_TOKEN ||
    execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  if (!token)
    throw new Error(
      'Authenticate with gh or set GITHUB_TOKEN before releasing.',
    );

  const result = spawnSync('release-it', process.argv.slice(2), {
    stdio: 'inherit',
    env: {
      ...process.env,
      GITHUB_TOKEN: token,
      THROWL_RELEASE_NOTES_FILE: draftPath,
    },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
