import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { commitMigrationPlans } from './firestore-migration-operations.mjs';

describe('Firestore migration writes', () => {
  test('replaces constrained documents so stale fields cannot survive', async () => {
    const calls = [];
    const db = {
      batch: () => ({
        set: (...args) => calls.push(['set', ...args]),
        update: (...args) => calls.push(['update', ...args]),
        commit: async () => calls.push(['commit']),
      }),
    };

    await commitMigrationPlans(db, [
      ['replace', 'profile', { name: 'Alice' }],
      ['replace', 'lookup', { user: 'users/alice' }],
      ['replace', 'friendship', { userIds: ['alice', 'bob'] }],
      ['merge', 'game', { playerIds: ['alice'], historyUserIds: ['alice'] }],
    ]);

    assert.deepEqual(calls, [
      ['set', 'profile', { name: 'Alice' }],
      ['set', 'lookup', { user: 'users/alice' }],
      ['set', 'friendship', { userIds: ['alice', 'bob'] }],
      [
        'set',
        'game',
        { playerIds: ['alice'], historyUserIds: ['alice'] },
        { merge: true },
      ],
      ['commit'],
    ]);
  });

  test('fails loudly for an unknown operation', async () => {
    const db = {
      batch: () => ({ set() {}, update() {}, async commit() {} }),
    };
    await assert.rejects(
      commitMigrationPlans(db, [['unknown', 'doc', {}]]),
      /Unknown migration operation/,
    );
  });
});
