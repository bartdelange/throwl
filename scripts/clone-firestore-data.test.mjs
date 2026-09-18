import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { remapFirestoreValue } from './clone-firestore-data.mjs';

const sourceApp = initializeApp(
  { projectId: 'darts-counter-b73d6' },
  'clone-test-source',
);
const targetApp = initializeApp(
  { projectId: 'throwl-dev' },
  'clone-test-target',
);
const sourceDb = getFirestore(sourceApp);
const targetDb = getFirestore(targetApp);

after(async () => {
  await Promise.all([deleteApp(sourceApp), deleteApp(targetApp)]);
});

describe('Firestore clone value transformation', () => {
  test('recursively remaps references and preserves native values', () => {
    const timestamp = Timestamp.fromMillis(1_700_000_000_123);
    const geoPoint = new GeoPoint(52.37, 4.9);
    const bytes = Buffer.from([1, 2, 3]);
    const inventory = {
      referenceCount: 0,
      referenceDocumentPaths: new Set(),
      referenceProjects: new Set(),
      nativeTypes: new Set(),
      unsupportedTypes: new Set(),
    };
    const transformed = remapFirestoreValue(
      {
        nested: [
          sourceDb.doc('users/ABC'),
          { timestamp, geoPoint, bytes, nil: null, enabled: true },
        ],
      },
      targetDb,
      inventory,
      'games/game-1',
    );

    assert.equal(transformed.nested[0].path, 'users/ABC');
    assert.equal(transformed.nested[0].firestore.projectId, 'throwl-dev');
    assert.equal(transformed.nested[1].timestamp, timestamp);
    assert.equal(transformed.nested[1].geoPoint, geoPoint);
    assert.notEqual(transformed.nested[1].bytes, bytes);
    assert.deepEqual(transformed.nested[1].bytes, bytes);
    assert.equal(inventory.referenceCount, 1);
    assert.deepEqual([...inventory.referenceProjects], ['darts-counter-b73d6']);
    assert.deepEqual([...inventory.referenceDocumentPaths], ['games/game-1']);
    assert.equal(inventory.unsupportedTypes.size, 0);
  });
});
