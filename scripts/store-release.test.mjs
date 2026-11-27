import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  markReady,
  readReleaseIdentity,
  readStoreNotes,
} from './store-release.mjs';

test('store notes come from the dedicated block and the GitHub changelog stays intact', async () => {
  const template = await readFile(
    new URL('../apps/throwl/fastlane/store-release-notes.md', import.meta.url),
    'utf8',
  );
  const original = template.replace(
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
  assert.doesNotMatch(ready, /Production review drafts have not been prepared/);
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
