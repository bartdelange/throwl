import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  draftTemplate,
  markReady,
  readReleaseIdentity,
  readStoreNotes,
} from './store-release.mjs';

test('store notes come from the dedicated block and the GitHub changelog stays intact', () => {
  const original = draftTemplate().replace(
    '## Changes',
    '## Changes\nUpdated the scoreboard.',
  );
  assert.throws(() => readStoreNotes(original), /What’s New/);
  const edited = original.replace('"whatsNew": ""', '"whatsNew": "Team games"');
  assert.deepEqual(readStoreNotes(edited), {
    'en-US': { whatsNew: 'Team games', iosPromotionalText: '' },
  });
  assert.throws(
    () => readStoreNotes(edited.replace('Team games', '🎯'.repeat(501))),
    /500 characters/,
  );
  assert.throws(
    () =>
      readStoreNotes(
        edited.replace(
          '"iosPromotionalText": ""',
          `"iosPromotionalText": "${'a'.repeat(171)}"`,
        ),
      ),
    /170 characters/,
  );
  const ready = markReady(edited);
  assert.match(ready, /Both stores are ready/);
  assert.match(ready, /Updated the scoreboard/);
  assert.deepEqual(readStoreNotes(ready), readStoreNotes(edited));
  assert.equal(markReady(ready), ready);
});

test('the expected release identity uses platform build numbers from the tag', () => {
  const gradle = 'versionCode 45\nversionName "5.1.2"';
  const xcode = 'CURRENT_PROJECT_VERSION = 7;\nMARKETING_VERSION = 5.1.2;';
  assert.deepEqual(readReleaseIdentity('v5.1.2', '5.1.2', gradle, xcode), {
    version: '5.1.2',
    androidBuild: '45',
    iosBuild: '7',
  });
  assert.throws(
    () => readReleaseIdentity('v5.1.3', '5.1.2', gradle, xcode),
    /must match/,
  );
  assert.throws(
    () =>
      readReleaseIdentity(
        'v5.1.2',
        '5.1.2',
        gradle,
        xcode.replace('5.1.2', '5.1.1'),
      ),
    /marketing versions/,
  );
});

test('the release wrapper forwards authored notes to release-it', async (t) => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtemp, rm, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { delimiter, join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const directory = await mkdtemp(join(tmpdir(), 'throwl-authored-notes-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const path = join(directory, 'notes.md');
  const notes = draftTemplate()
    .replace('## Changes', '## Changes\nYour teammate can now check out.')
    .replace('"whatsNew": ""', '"whatsNew": "Play together."');
  await writeFile(path, notes);
  await writeFile(
    join(directory, 'release-it'),
    '#!/bin/sh\nprintf "%s\\n" "$@"\ncat "$THROWL_RELEASE_NOTES_FILE"\n',
    { mode: 0o700 },
  );

  const script = fileURLToPath(
    new URL('./throwl-release.mjs', import.meta.url),
  );
  const result = spawnSync(process.execPath, [script, 'patch', '--dry-run'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: directory + delimiter + process.env.PATH,
      THROWL_RELEASE_NOTES_FILE: path,
      GITHUB_TOKEN: 'test-only-token',
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'patch\n--dry-run\n' + notes);
});
