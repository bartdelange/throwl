import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  commitMigrationPlans,
  summarizeMigrationPlans,
} from './firestore-migration-operations.mjs';

describe('Firestore migration writes', () => {
  test('replaces constrained documents so stale fields cannot survive', async () => {
    const calls = [];
    const db = {
      batch: () => ({
        set: (...args) => calls.push(['set', ...args]),
        update: (...args) => calls.push(['update', ...args]),
        delete: (...args) => calls.push(['delete', ...args]),
        commit: async () => calls.push(['commit']),
      }),
    };

    await commitMigrationPlans(db, [
      ['replace', 'profile', { name: 'Alice' }],
      ['replace', 'lookup', { user: 'users/alice' }],
      ['replace', 'friendship', { userIds: ['alice', 'bob'] }],
      ['merge', 'game', { playerIds: ['alice'], historyUserIds: ['alice'] }],
      ['delete', 'stale-lookup'],
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
      ['delete', 'stale-lookup'],
      ['commit'],
    ]);
  });

  test('summarizes every planned write and delete', () => {
    assert.deepEqual(
      summarizeMigrationPlans([['replace'], ['merge'], ['update'], ['delete']]),
      { replace: 1, merge: 1, update: 1, delete: 1, total: 4 },
    );
  });

  test('fails loudly for an unknown operation', async () => {
    const db = {
      batch: () => ({
        set: () => undefined,
        update: () => undefined,
        commit: async () => undefined,
      }),
    };
    await assert.rejects(
      commitMigrationPlans(db, [['unknown', 'doc', {}]]),
      /Unknown migration operation/,
    );
  });

  test('commits at most 450 operations per batch and exposes a recoverable partial commit', async () => {
    const committed = [];
    let batchNumber = 0;
    const db = {
      batch: () => {
        const currentBatch = batchNumber++;
        const pending = [];
        return {
          set: (reference) => pending.push(reference),
          update: (reference) => pending.push(reference),
          delete: (reference) => pending.push(reference),
          commit: async () => {
            if (currentBatch === 1) throw new Error('simulated batch failure');
            committed.push(...pending);
          },
        };
      },
    };
    const plans = Array.from({ length: 451 }, (_, index) => [
      'replace',
      `doc-${index}`,
      {},
    ]);

    await assert.rejects(commitMigrationPlans(db, plans), /simulated/);
    assert.equal(committed.length, 450);
    assert.equal(committed[0], 'doc-0');
    assert.equal(committed[449], 'doc-449');
  });
});
