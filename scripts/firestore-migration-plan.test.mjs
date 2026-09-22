import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Timestamp } from 'firebase-admin/firestore';
import {
  createEmptyMigrationState,
  planFinalize,
  planPrepare,
  planReconcile,
  verifyMigrationState,
} from './firestore-migration-plan.mjs';
import { commitMigrationPlans } from './firestore-migration-operations.mjs';

const REFERENCE = Symbol('DocumentReference');
const documentRef = (collection, id) => ({
  [REFERENCE]: true,
  path: `${collection}/${id}`,
  id,
});
const userRef = (uid) => documentRef('users', uid);
const timestamp = (value = '2026-01-01T00:00:00Z') => ({
  toDate: () => new Date(value),
});
const snapshot = (collection, id, data) => ({
  ref: documentRef(collection, id),
  data,
});

function put(state, collection, id, data) {
  state[collection].set(id, snapshot(collection, id, data));
}

function legacyUser(email, name, friends = []) {
  return { email, name, friends };
}

function friend(uid, confirmed = false, requester = 'alice') {
  return {
    confirmed,
    ...(confirmed ? {} : { requester: userRef(requester) }),
    user: userRef(uid),
  };
}

function game(players, extra = {}) {
  return {
    players,
    turns: [],
    started: timestamp(),
    finished: null,
    options: { mode: 'x01', startingScore: 501 },
    startingScore: 501,
    ...extra,
  };
}

function baseState() {
  const state = createEmptyMigrationState(documentRef);
  put(
    state,
    'users',
    'alice',
    legacyUser('Alice@Example.test', 'Alice', [friend('bob')]),
  );
  put(
    state,
    'users',
    'bob',
    legacyUser('bob@example.test', 'Bob', [friend('alice')]),
  );
  put(state, 'games', 'legacy', game([userRef('alice'), userRef('bob')]));
  return state;
}

function applyPlans(state, plans) {
  for (const [operation, ref, data] of plans) {
    const [collection, id] = ref.path.split('/');
    if (operation === 'delete') {
      state[collection].delete(id);
      continue;
    }
    const current = state[collection].get(id)?.data ?? {};
    const next = operation === 'merge' ? { ...current, ...data } : data;
    put(state, collection, id, next);
  }
}

function prepare(state) {
  const result = planPrepare(state);
  assert.deepEqual(result.errors, []);
  applyPlans(state, result.plans);
}

const reconcileOptions = {
  disposableUsers: [{ uid: 'review', email: 'review@example.test' }],
};

describe('prepare', () => {
  test('is idempotent and does not remove legacy fields or infer createdBy', () => {
    const state = baseState();
    const originalGame = state.games.get('legacy').data;
    const originalDomain = { ...originalGame };
    prepare(state);
    const once = state.games.get('legacy').data;
    prepare(state);
    assert.deepEqual(state.games.get('legacy').data, once);
    assert.ok(Array.isArray(state.users.get('alice').data.friends));
    assert.deepEqual(
      state.games.get('legacy').data.players,
      originalGame.players,
    );
    assert.deepEqual(state.games.get('legacy').data, {
      ...originalDomain,
      playerIds: ['alice', 'bob'],
      historyUserIds: ['alice', 'bob'],
    });
    assert.equal(state.games.get('legacy').data.createdBy, undefined);
  });

  test('creates pending and accepted friendships from legacy state', () => {
    const state = baseState();
    prepare(state);
    assert.equal(state.friendships.get('alice_bob').data.status, 'pending');
    state.users.get('alice').data.friends = [friend('bob', true)];
    state.users.get('bob').data.friends = [friend('alice', true)];
    prepare(state);
    assert.equal(state.friendships.get('alice_bob').data.status, 'accepted');
  });

  test('binds every new write target through the reference factory accepted by the batch boundary', async () => {
    const state = baseState();
    const result = planPrepare(state);
    assert.deepEqual(result.errors, []);
    assert.ok(result.plans.length > 0);
    assert.ok(result.plans.every(([, ref]) => ref[REFERENCE] === true));
    const assertReference = (ref) => assert.equal(ref[REFERENCE], true);
    await commitMigrationPlans(
      {
        batch: () => ({
          set: assertReference,
          update: assertReference,
          delete: assertReference,
          commit: async () => undefined,
        }),
      },
      result.plans,
    );
  });

  test('is safely rerunnable after partial application', () => {
    const state = baseState();
    const first = planPrepare(state);
    assert.deepEqual(first.errors, []);
    applyPlans(state, first.plans.slice(0, 2));
    const retry = planPrepare(state);
    assert.deepEqual(retry.errors, []);
    applyPlans(state, retry.plans);
    assert.deepEqual(verifyMigrationState(state).errors, []);
  });

  test('rejects a one-sided legacy friendship', () => {
    const state = baseState();
    state.users.get('bob').data.friends = [];
    const result = planPrepare(state);
    assert.ok(result.errors.some((error) => error.includes('not reciprocal')));
  });

  test('preserves history removals and intersects removed players', () => {
    const state = baseState();
    state.games.get('legacy').data.historyUserIds = ['alice'];
    prepare(state);
    assert.deepEqual(state.games.get('legacy').data.historyUserIds, ['alice']);
    assert.deepEqual(state.games.get('legacy').data.playerIds, [
      'alice',
      'bob',
    ]);
    state.games.get('legacy').data.players = [userRef('bob')];
    const reduction = planPrepare(state);
    assert.deepEqual(reduction.errors, []);
    assert.deepEqual(
      reduction.plans.find(
        ([operation, ref]) =>
          operation === 'merge' && ref.path === 'games/legacy',
      )[3].removedHistoryUserIds,
      ['alice'],
    );
    applyPlans(state, reduction.plans);
    assert.deepEqual(state.games.get('legacy').data.historyUserIds, []);
    assert.deepEqual(state.games.get('legacy').data.playerIds, ['bob']);
  });

  test('accepts and preserves legitimate historical domain shapes', () => {
    const fixtures = [
      {
        id: 'earliest',
        data: {
          players: [userRef('alice')],
          turns: 'opaque historical turns',
          started: Timestamp.fromDate(new Date('2021-11-23T12:00:00Z')),
          finished: { unexpected: 'but untouched' },
        },
      },
      {
        id: 'legacy-x01',
        data: {
          players: [userRef('alice')],
          turns: [],
          started: Timestamp.fromDate(new Date('2021-12-02T12:00:00Z')),
          finished: null,
          startingScore: 301,
        },
      },
      {
        id: 'newer-legacy',
        data: game([userRef('alice')], {
          started: Timestamp.fromDate(new Date('2026-01-06T12:00:00Z')),
          options: { mode: 'x01', startingScore: 501 },
        }),
      },
      {
        id: 'opaque-guests',
        data: game([
          userRef('alice'),
          '',
          'x'.repeat(500),
          'Duplicate guest',
          'Duplicate guest',
        ]),
      },
    ];
    const state = baseState();
    state.games.clear();
    for (const fixture of fixtures) {
      put(state, 'games', fixture.id, fixture.data);
    }
    const originals = new Map(fixtures.map(({ id, data }) => [id, data]));

    const result = planPrepare(state);
    assert.deepEqual(result.errors, []);
    const gamePlans = result.plans.filter(
      ([operation, ref]) =>
        operation === 'merge' && ref.path.startsWith('games/'),
    );
    assert.equal(gamePlans.length, fixtures.length);
    for (const [, , fields] of gamePlans) {
      assert.deepEqual(Object.keys(fields).sort(), [
        'historyUserIds',
        'playerIds',
      ]);
    }
    applyPlans(state, result.plans);
    assert.deepEqual(verifyMigrationState(state).errors, []);
    for (const { id } of fixtures) {
      assert.deepEqual(state.games.get(id).data, {
        ...originals.get(id),
        playerIds: ['alice'],
        historyUserIds: ['alice'],
      });
    }
  });

  test('preserves registered-player order in historical games above eight players', () => {
    const state = createEmptyMigrationState(documentRef);
    const userIds = Array.from({ length: 10 }, (_, index) => `user-${index}`);
    for (const uid of userIds) {
      put(state, 'users', uid, legacyUser(`${uid}@example.test`, uid));
    }
    put(state, 'games', 'large-history', {
      players: userIds.map(userRef),
      turns: [],
      started: Timestamp.now(),
      finished: null,
      startingScore: 501,
    });

    prepare(state);
    assert.deepEqual(state.games.get('large-history').data.playerIds, userIds);
    assert.deepEqual(
      state.games.get('large-history').data.historyUserIds,
      userIds,
    );
    assert.deepEqual(verifyMigrationState(state).errors, []);
  });

  test('rejects duplicate registered-user references', () => {
    const state = baseState();
    state.games.get('legacy').data.players = [
      userRef('alice'),
      'Duplicate guest',
      'Duplicate guest',
      userRef('alice'),
    ];
    const result = planPrepare(state);
    assert.ok(
      result.errors.includes(
        'games/legacy has a duplicate registered player reference',
      ),
    );
  });

  test('rejects malformed and unknown registered-user references', () => {
    const malformed = baseState();
    malformed.games.get('legacy').data.players = [
      documentRef('publicProfiles', 'alice'),
    ];
    assert.ok(
      planPrepare(malformed).errors.includes(
        'games/legacy has an invalid registered player reference',
      ),
    );

    const unknown = baseState();
    unknown.games.get('legacy').data.players = [userRef('missing')];
    assert.ok(
      planPrepare(unknown).errors.includes(
        'games/legacy has an invalid registered player reference',
      ),
    );
  });
});

describe('reconcile', () => {
  test('backfills a new v4 user and game created after prepare', () => {
    const state = baseState();
    prepare(state);
    put(state, 'users', 'carol', legacyUser('carol@example.test', 'Carol'));
    put(state, 'games', 'new-v4', game([userRef('carol')]));
    const result = planReconcile(state, reconcileOptions);
    assert.deepEqual(result.errors, []);
    applyPlans(state, result.plans);
    assert.equal(state.publicProfiles.get('carol').data.name, 'Carol');
    assert.deepEqual(state.games.get('new-v4').data.playerIds, ['carol']);
    assert.deepEqual(state.games.get('new-v4').data.historyUserIds, ['carol']);
  });

  test('refreshes changed names and emails and deletes stale lookups', () => {
    const state = baseState();
    prepare(state);
    state.users.get('alice').data.name = 'Alice Updated';
    state.users.get('alice').data.email = 'new@example.test';
    const result = planReconcile(state, reconcileOptions);
    assert.deepEqual(result.errors, []);
    applyPlans(state, result.plans);
    assert.equal(state.publicProfiles.get('alice').data.name, 'Alice Updated');
    assert.equal(state.userLookups.has('alice@example.test'), false);
    assert.equal(
      state.userLookups.get('new@example.test').data.user.id,
      'alice',
    );
  });

  test('creates, accepts, and deletes friendships authoritatively', () => {
    const state = baseState();
    prepare(state);
    state.users.get('alice').data.friends = [friend('bob', true)];
    state.users.get('bob').data.friends = [friend('alice', true)];
    let result = planReconcile(state, reconcileOptions);
    assert.deepEqual(result.errors, []);
    applyPlans(state, result.plans);
    assert.equal(state.friendships.get('alice_bob').data.status, 'accepted');

    state.users.get('alice').data.friends = [];
    state.users.get('bob').data.friends = [];
    result = planReconcile(state, reconcileOptions);
    assert.deepEqual(result.errors, []);
    applyPlans(state, result.plans);
    assert.equal(state.friendships.has('alice_bob'), false);
  });

  test('deletes a stale canonical friendship absent from v4', () => {
    const state = baseState();
    state.users.get('alice').data.friends = [];
    state.users.get('bob').data.friends = [];
    put(state, 'friendships', 'alice_bob', {
      requester: 'alice',
      status: 'accepted',
      userIds: ['alice', 'bob'],
    });
    const result = planReconcile(state, reconcileOptions);
    assert.deepEqual(result.errors, []);
    assert.ok(
      result.plans.some(
        ([operation, ref]) =>
          operation === 'delete' && ref.path === 'friendships/alice_bob',
      ),
    );
  });

  test('removes disposable account data without resurrecting history', () => {
    const state = baseState();
    prepare(state);
    put(state, 'users', 'review', {
      email: 'review@example.test',
      name: 'Review',
    });
    put(state, 'publicProfiles', 'review', { name: 'Review' });
    put(state, 'userLookups', 'review@example.test', {
      user: userRef('review'),
    });
    put(state, 'friendships', 'alice_review', {
      requester: 'review',
      status: 'pending',
      userIds: ['alice', 'review'],
    });
    put(
      state,
      'games',
      'review-game',
      game([userRef('review')], {
        createdBy: 'review',
        playerIds: ['review'],
        historyUserIds: [],
      }),
    );
    state.games.get('legacy').data.historyUserIds = ['alice'];
    const result = planReconcile(state, reconcileOptions);
    assert.deepEqual(result.errors, []);
    applyPlans(state, result.plans);
    assert.equal(state.users.has('review'), false);
    assert.equal(state.publicProfiles.has('review'), false);
    assert.equal(state.userLookups.has('review@example.test'), false);
    assert.equal(state.friendships.has('alice_review'), false);
    assert.equal(state.games.has('review-game'), false);
    assert.deepEqual(state.games.get('legacy').data.historyUserIds, ['alice']);
  });

  test('aborts on an unlisted canonical-only user', () => {
    const state = baseState();
    put(state, 'users', 'unknown', {
      email: 'unknown@example.test',
      name: 'Unknown',
    });
    const result = planReconcile(state, reconcileOptions);
    assert.ok(result.errors.some((error) => error.includes('users/unknown')));
  });

  test('aborts when disposable UID and confirmed email do not match', () => {
    const state = baseState();
    const result = planReconcile(state, {
      disposableUsers: [{ uid: 'alice', email: 'review@example.test' }],
    });
    assert.ok(result.errors.some((error) => error.includes('confirmed email')));
  });

  test('aborts a fresh reconciliation when a configured disposable user is missing', () => {
    const state = baseState();
    put(state, 'publicProfiles', 'review', { name: 'Review' });
    const result = planReconcile(state, reconcileOptions);
    assert.ok(
      result.errors.some((error) =>
        error.includes('missing without a matching in-progress'),
      ),
    );
  });

  test('does not permit a real legacy user as disposable even with a matching email', () => {
    const state = baseState();
    const result = planReconcile(state, {
      disposableUsers: [{ uid: 'alice', email: 'alice@example.test' }],
    });
    assert.ok(
      result.errors.some((error) =>
        error.includes('not a canonical-only review/test account'),
      ),
    );
  });

  test('aborts on mixed real and disposable games unless explicitly deleted', () => {
    const state = baseState();
    put(state, 'users', 'review', {
      email: 'review@example.test',
      name: 'Review',
    });
    put(
      state,
      'games',
      'mixed',
      game([userRef('alice'), userRef('review')], {
        createdBy: 'review',
      }),
    );
    let result = planReconcile(state, reconcileOptions);
    assert.ok(
      result.errors.some((error) => error.includes('games/mixed mixes')),
    );
    result = planReconcile(state, {
      ...reconcileOptions,
      deleteGameIds: ['mixed'],
    });
    assert.deepEqual(result.errors, []);
    assert.ok(
      result.plans.some(
        ([operation, ref]) =>
          operation === 'delete' && ref.path === 'games/mixed',
      ),
    );
  });

  test('reruns after partial cleanup and an approved game was already deleted', () => {
    const state = baseState();
    prepare(state);
    put(state, 'users', 'review', {
      email: 'review@example.test',
      name: 'Review',
    });
    put(state, 'publicProfiles', 'review', { name: 'Review' });
    put(state, 'userLookups', 'review@example.test', {
      user: userRef('review'),
    });
    put(
      state,
      'games',
      'mixed',
      game([userRef('alice'), userRef('review')], {
        createdBy: 'review',
        playerIds: ['alice', 'review'],
        historyUserIds: ['alice', 'review'],
      }),
    );
    const options = { ...reconcileOptions, deleteGameIds: ['mixed'] };
    const first = planReconcile(state, options);
    assert.deepEqual(first.errors, []);
    put(state, 'migrationState', 'throwl-v5', {
      phase: 'reconciling',
      disposableUsers: reconcileOptions.disposableUsers,
    });
    const gameDeleteIndex = first.plans.findIndex(
      ([operation, ref]) =>
        operation === 'delete' && ref.path === 'games/mixed',
    );
    applyPlans(state, first.plans.slice(0, gameDeleteIndex + 1));
    assert.equal(state.games.has('mixed'), false);
    assert.equal(state.users.has('review'), false);

    const retry = planReconcile(state, options);
    assert.deepEqual(retry.errors, []);
    applyPlans(state, retry.plans);
    assert.deepEqual(
      verifyMigrationState(state, {
        ...options,
        allowPartiallyFinalized: false,
      }).errors,
      [],
    );
  });

  test('brackets only multi-batch reconciliation with in-progress and completed markers', () => {
    const state = createEmptyMigrationState(documentRef);
    for (let index = 0; index < 226; index += 1) {
      put(
        state,
        'users',
        `user-${index}`,
        legacyUser(`user-${index}@example.test`, `User ${index}`),
      );
    }
    const result = planReconcile(state, reconcileOptions);
    assert.deepEqual(result.errors, []);
    assert.ok(result.plans.length > 450);
    assert.deepEqual(result.plans[0][2].phase, 'reconciling');
    assert.deepEqual(result.plans.at(-1)[2].phase, 'reconciled');
    assert.equal(result.plans[0][1].path, 'migrationState/throwl-v5');
    assert.equal(result.plans.at(-1)[1].path, 'migrationState/throwl-v5');
  });
});

describe('finalize and verify', () => {
  test('removes users.friends but retains all game domain state and players', () => {
    const state = baseState();
    prepare(state);
    const reconciliation = planReconcile(state, reconcileOptions);
    assert.deepEqual(reconciliation.errors, []);
    applyPlans(state, reconciliation.plans);
    const before = state.games.get('legacy').data;
    const result = planFinalize(state, reconcileOptions);
    assert.deepEqual(result.errors, []);
    applyPlans(state, result.plans);
    assert.deepEqual(state.users.get('alice').data, {
      email: 'Alice@Example.test',
      name: 'Alice',
    });
    assert.deepEqual(state.games.get('legacy').data, before);
    assert.deepEqual(
      verifyMigrationState(state, {
        ...reconcileOptions,
        finalized: true,
      }).errors,
      [],
    );
  });

  test('is safely rerunnable after a partial finalize', () => {
    const state = baseState();
    prepare(state);
    const reconciliation = planReconcile(state, reconcileOptions);
    assert.deepEqual(reconciliation.errors, []);
    applyPlans(state, reconciliation.plans);

    const first = planFinalize(state, reconcileOptions);
    assert.deepEqual(first.errors, []);
    applyPlans(state, first.plans.slice(0, 1));
    assert.deepEqual(Object.keys(state.users.get('alice').data).sort(), [
      'email',
      'name',
    ]);
    assert.ok(Array.isArray(state.users.get('bob').data.friends));

    const retry = planFinalize(state, reconcileOptions);
    assert.deepEqual(retry.errors, []);
    applyPlans(state, retry.plans);
    assert.deepEqual(
      verifyMigrationState(state, {
        ...reconcileOptions,
        finalized: true,
      }).errors,
      [],
    );
  });

  test('rejects unknown user fields before replacement', () => {
    const state = baseState();
    prepare(state);
    const reconciliation = planReconcile(state, reconcileOptions);
    assert.deepEqual(reconciliation.errors, []);
    applyPlans(state, reconciliation.plans);
    state.users.get('alice').data.unexpected = 'must survive';
    const result = planFinalize(state, reconcileOptions);
    assert.ok(result.errors.some((error) => error.includes('users/alice')));
    assert.equal(state.users.get('alice').data.unexpected, 'must survive');
  });

  test('requires the completed reconcile marker', () => {
    const state = baseState();
    prepare(state);
    const result = planFinalize(state, reconcileOptions);
    assert.deepEqual(result.errors, [
      'finalize requires the matching completed reconcile migration marker',
    ]);
  });
});
