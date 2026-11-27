import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(
  new URL('./release-artifact.mjs', import.meta.url),
);

test('the upload job recovers the exact signed bundle and rejects altered handoffs', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'throwl-release-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const original = join(directory, 'original.ipa');
  const encrypted = join(directory, 'release-bundle.enc');
  const recovered = join(directory, 'recovered.ipa');
  const rejected = join(directory, 'rejected.ipa');
  const bytes = randomBytes(8192);
  await writeFile(original, bytes);

  const key = randomBytes(32).toString('hex');
  const context = 'release-run:release-commit:apps/throwl/ios';
  const run = (args, secret = key, release = context) =>
    spawnSync(process.execPath, [script, ...args], {
      env: { RELEASE_ARTIFACT_KEY: secret, RELEASE_ARTIFACT_CONTEXT: release },
      encoding: 'utf8',
    });

  assert.notEqual(run(['check'], '').status, 0);

  const encryption = run(['encrypt', original, encrypted]);
  assert.equal(encryption.status, 0, encryption.stderr);
  assert.notDeepEqual(await readFile(encrypted), bytes);

  const decryption = run(['decrypt', encrypted, recovered]);
  assert.equal(decryption.status, 0, decryption.stderr);
  assert.deepEqual(await readFile(recovered), bytes);

  const decrypt = ['decrypt', encrypted, rejected];
  assert.notEqual(run(decrypt, randomBytes(32).toString('hex')).status, 0);
  assert.notEqual(run(decrypt, key, 'different-release').status, 0);

  const tampered = await readFile(encrypted);
  tampered[tampered.length - 1] ^= 1;
  await writeFile(encrypted, tampered);
  assert.notEqual(run(decrypt).status, 0);
  await assert.rejects(readFile(rejected), { code: 'ENOENT' });
});
