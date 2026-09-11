import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const projectId = 'demo-throwl-rules';
let env;

const auth = (uid, email) =>
  env.authenticatedContext(uid, { email }).firestore();
const userRef = (db, uid) => doc(db, 'users', uid);
const friendshipId = (left, right) => [left, right].sort().join('_');
const x01Game = (db, owner = 'alice', players = ['alice', 'bob']) => ({
  owner,
  playerIds: players,
  players: players.map((uid) => userRef(db, uid)),
  turns: [],
  started: new Date('2026-01-01T00:00:00Z'),
  finished: null,
  options: { mode: 'x01', startingScore: 501 },
  startingScore: 501,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const [uid, email, name] of [
      ['alice', 'alice@example.test', 'Alice'],
      ['bob', 'bob@example.test', 'Bob'],
      ['charlie', 'charlie@example.test', 'Charlie'],
    ]) {
      await setDoc(doc(db, 'users', uid), { email, name });
      await setDoc(doc(db, 'publicProfiles', uid), { name });
      await setDoc(doc(db, 'userLookups', email), { user: userRef(db, uid) });
    }
    await setDoc(doc(db, 'friendships', friendshipId('alice', 'bob')), {
      requester: 'alice',
      status: 'accepted',
      userIds: ['alice', 'bob'],
    });
    await setDoc(doc(db, 'games', 'alice-bob'), x01Game(db));
    await setDoc(
      doc(db, 'games', 'charlie-only'),
      x01Game(db, 'charlie', ['charlie']),
    );
  });
});

after(async () => env.cleanup());

describe('authentication and users', () => {
  test('unauthenticated clients cannot access user or game data', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users', 'alice')));
    await assertFails(getDoc(doc(db, 'games', 'alice-bob')));
  });

  test('Alice can read and update her own constrained profile', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertSucceeds(getDoc(doc(db, 'users', 'alice')));
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'alice'), { name: 'Alice A.' }),
    );
  });

  test('Alice cannot modify Bob or add protected fields', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertFails(updateDoc(doc(db, 'users', 'bob'), { name: 'Mallory' }));
    await assertFails(
      updateDoc(doc(db, 'users', 'bob'), { email: 'alice@example.test' }),
    );
    await assertFails(updateDoc(doc(db, 'users', 'alice'), { admin: true }));
  });
});

describe('exact lookup and friendships', () => {
  test('exact lookup works, while collection enumeration is denied', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertSucceeds(getDoc(doc(db, 'userLookups', 'bob@example.test')));
    await assertFails(getDocs(collection(db, 'userLookups')));
  });

  test('a legitimate pending request can be created', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertSucceeds(
      setDoc(doc(db, 'friendships', friendshipId('alice', 'charlie')), {
        requester: 'alice',
        status: 'pending',
        userIds: ['alice', 'charlie'],
      }),
    );
  });

  test('friendship IDs must be the canonical sorted participant pair', async () => {
    const db = auth('alice', 'alice@example.test');
    const pending = {
      requester: 'alice',
      status: 'pending',
      userIds: ['alice', 'charlie'],
    };
    await assertFails(setDoc(doc(db, 'friendships', 'arbitrary'), pending));
    await assertFails(
      setDoc(doc(db, 'friendships', 'charlie_alice'), {
        ...pending,
        userIds: ['charlie', 'alice'],
      }),
    );
    await assertFails(
      setDoc(doc(db, 'friendships', 'alice_alice'), {
        requester: 'alice',
        status: 'pending',
        userIds: ['alice', 'alice'],
      }),
    );
  });

  test('forged and unrelated friendship writes fail', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertFails(
      setDoc(doc(db, 'friendships', 'bob_charlie'), {
        requester: 'bob',
        status: 'pending',
        userIds: ['bob', 'charlie'],
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'friendships', friendshipId('alice', 'bob')), {
        note: 'piggyback',
      }),
    );
  });

  test('only the recipient can accept; either member can reject/remove', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'friendships', friendshipId('alice', 'charlie')), {
        requester: 'alice',
        status: 'pending',
        userIds: ['alice', 'charlie'],
      });
    });
    const alice = auth('alice', 'alice@example.test');
    const charlie = auth('charlie', 'charlie@example.test');
    await assertFails(
      updateDoc(doc(alice, 'friendships', friendshipId('alice', 'charlie')), {
        status: 'accepted',
      }),
    );
    await assertSucceeds(
      updateDoc(doc(charlie, 'friendships', friendshipId('alice', 'charlie')), {
        status: 'accepted',
      }),
    );
    await assertSucceeds(
      deleteDoc(doc(alice, 'friendships', friendshipId('alice', 'charlie'))),
    );
  });
});

describe('games', () => {
  test('a player can create a game with self, an accepted friend, and a guest', async () => {
    const db = auth('alice', 'alice@example.test');
    const game = x01Game(db);
    game.players.push('Guest player');
    await assertSucceeds(setDoc(doc(db, 'games', 'new-game'), game));
  });

  test('the creator cannot falsely attribute a game to an unrelated user', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertFails(
      setDoc(
        doc(db, 'games', 'forged'),
        x01Game(db, 'alice', ['alice', 'charlie']),
      ),
    );
  });

  test('authorization membership must exactly match registered players', async () => {
    const db = auth('alice', 'alice@example.test');

    const missingDisplayedPlayer = x01Game(db, 'alice', ['alice', 'bob']);
    missingDisplayedPlayer.players = [userRef(db, 'alice'), 'Guest'];
    await assertFails(
      setDoc(doc(db, 'games', 'missing-player'), missingDisplayedPlayer),
    );

    const hiddenRegisteredPlayer = x01Game(db, 'alice', ['alice']);
    hiddenRegisteredPlayer.players.push(userRef(db, 'bob'));
    await assertFails(
      setDoc(doc(db, 'games', 'hidden-player'), hiddenRegisteredPlayer),
    );

    const duplicate = x01Game(db, 'alice', ['alice', 'alice']);
    await assertFails(setDoc(doc(db, 'games', 'duplicate-player'), duplicate));

    const guestMembership = x01Game(db, 'alice', ['alice', 'Guest']);
    guestMembership.players = [userRef(db, 'alice'), 'Guest'];
    await assertFails(
      setDoc(doc(db, 'games', 'guest-membership'), guestMembership),
    );
  });

  test('malformed player references and boundary turns are rejected', async () => {
    const db = auth('alice', 'alice@example.test');
    const malformedPlayer = x01Game(db, 'alice', ['alice']);
    malformedPlayer.players = [doc(db, 'publicProfiles', 'alice')];
    await assertFails(
      setDoc(doc(db, 'games', 'malformed-player'), malformedPlayer),
    );

    const malformedTurn = x01Game(db, 'alice', ['alice']);
    malformedTurn.turns = [
      { userId: userRef(db, 'alice'), throws: [], unexpected: true },
    ];
    await assertFails(
      setDoc(doc(db, 'games', 'malformed-turn'), malformedTurn),
    );
  });

  test('listed players can read, update game state, and delete', async () => {
    const db = auth('bob', 'bob@example.test');
    await assertSucceeds(getDoc(doc(db, 'games', 'alice-bob')));
    await assertSucceeds(
      updateDoc(doc(db, 'games', 'alice-bob'), {
        turns: [{ userId: userRef(db, 'bob'), throws: [] }],
      }),
    );
    await assertSucceeds(deleteDoc(doc(db, 'games', 'alice-bob')));
  });

  test('former friends retain access to their immutable-membership game history', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await deleteDoc(
        doc(context.firestore(), 'friendships', friendshipId('alice', 'bob')),
      );
    });
    const db = auth('bob', 'bob@example.test');
    await assertSucceeds(getDoc(doc(db, 'games', 'alice-bob')));
    await assertSucceeds(
      updateDoc(doc(db, 'games', 'alice-bob'), { turns: [] }),
    );
  });

  test('an unrelated authenticated user cannot access a private game', async () => {
    const db = auth('charlie', 'charlie@example.test');
    await assertFails(getDoc(doc(db, 'games', 'alice-bob')));
    await assertFails(updateDoc(doc(db, 'games', 'alice-bob'), { turns: [] }));
    await assertFails(deleteDoc(doc(db, 'games', 'alice-bob')));
  });

  test('players, owner, and start time are immutable after creation', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertFails(
      updateDoc(doc(db, 'games', 'alice-bob'), {
        players: [userRef(db, 'alice')],
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'games', 'alice-bob'), { owner: 'bob' }),
    );
    await assertFails(
      updateDoc(doc(db, 'games', 'alice-bob'), { started: new Date() }),
    );
  });

  test('membership-scoped game queries work', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertSucceeds(
      getDocs(
        query(
          collection(db, 'games'),
          where('playerIds', 'array-contains', 'alice'),
        ),
      ),
    );
    await assertFails(getDocs(collection(db, 'games')));
  });
});
