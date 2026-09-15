import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  deleteApp,
  initializeApp,
} from '../node_modules/@firebase/firestore/node_modules/@firebase/app/dist/esm/index.esm.js';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  getFirestore,
  limit,
  orderBy,
  startAfter,
  where,
  writeBatch,
} from 'firebase/firestore';

const projectId = 'demo-throwl-rules';
let env;
let contextId = 0;

const firestoreFor = (context) => {
  const app = initializeApp({ projectId }, `rules-test-${contextId++}`);
  app.delete = () => deleteApp(app);
  context.app = app;
  const db = getFirestore(context.app);
  connectFirestoreEmulator(
    db,
    env.emulators.firestore.host,
    env.emulators.firestore.port,
    { mockUserToken: context.authToken },
  );
  return db;
};

const auth = (uid, email) =>
  firestoreFor(env.authenticatedContext(uid, { email }));

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
const doublesGame = (db, owner = 'alice', players = ['alice']) => {
  const game = x01Game(db, owner, players);
  game.options = {
    mode: 'doubles',
    quickMatch: false,
    skipBull: false,
    endOnInvalid: true,
  };
  delete game.startingScore;
  return game;
};
const validTurn = (db, uid = 'alice', isValid = true) => ({
  userId: userRef(db, uid),
  throws: [
    { type: 'triple', score: 20 },
    { type: 'double', score: 20 },
    { type: 'single', score: 20 },
  ],
  isValid,
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
    const db = firestoreFor(context);
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
    const db = firestoreFor(env.unauthenticatedContext());
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

  test('the real three-write user creation batch preserves linked data', async () => {
    const db = auth('dave', 'dave@example.test');
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', 'dave'), {
      email: 'dave@example.test',
      name: 'Dave',
    });
    batch.set(doc(db, 'publicProfiles', 'dave'), { name: 'Dave' });
    batch.set(doc(db, 'userLookups', 'dave@example.test'), {
      user: userRef(db, 'dave'),
    });
    await assertSucceeds(batch.commit());
  });

  test('inconsistent or forged user creation batches fail', async () => {
    const mismatchedProfileDb = auth('dave', 'dave@example.test');
    const mismatchedProfile = writeBatch(mismatchedProfileDb);
    mismatchedProfile.set(doc(mismatchedProfileDb, 'users', 'dave'), {
      email: 'dave@example.test',
      name: 'Dave',
    });
    mismatchedProfile.set(doc(mismatchedProfileDb, 'publicProfiles', 'dave'), {
      name: 'Mallory',
    });
    mismatchedProfile.set(
      doc(mismatchedProfileDb, 'userLookups', 'dave@example.test'),
      { user: userRef(mismatchedProfileDb, 'dave') },
    );
    await assertFails(mismatchedProfile.commit());

    const wrongLookupDb = auth('erin', 'erin@example.test');
    const wrongLookup = writeBatch(wrongLookupDb);
    wrongLookup.set(doc(wrongLookupDb, 'users', 'erin'), {
      email: 'erin@example.test',
      name: 'Erin',
    });
    wrongLookup.set(doc(wrongLookupDb, 'publicProfiles', 'erin'), {
      name: 'Erin',
    });
    wrongLookup.set(doc(wrongLookupDb, 'userLookups', 'erin@example.test'), {
      user: userRef(wrongLookupDb, 'alice'),
    });
    await assertFails(wrongLookup.commit());

    const wrongEmailDb = auth('frank', 'frank@example.test');
    const wrongEmail = writeBatch(wrongEmailDb);
    wrongEmail.set(doc(wrongEmailDb, 'users', 'frank'), {
      email: 'different@example.test',
      name: 'Frank',
    });
    wrongEmail.set(doc(wrongEmailDb, 'publicProfiles', 'frank'), {
      name: 'Frank',
    });
    wrongEmail.set(doc(wrongEmailDb, 'userLookups', 'frank@example.test'), {
      user: userRef(wrongEmailDb, 'frank'),
    });
    await assertFails(wrongEmail.commit());

    const wrongKeyDb = auth('grace', 'grace@example.test');
    const wrongKey = writeBatch(wrongKeyDb);
    wrongKey.set(doc(wrongKeyDb, 'users', 'grace'), {
      email: 'grace@example.test',
      name: 'Grace',
    });
    wrongKey.set(doc(wrongKeyDb, 'publicProfiles', 'grace'), {
      name: 'Grace',
    });
    wrongKey.set(doc(wrongKeyDb, 'userLookups', 'wrong@example.test'), {
      user: userRef(wrongKeyDb, 'grace'),
    });
    await assertFails(wrongKey.commit());

    const attacker = auth('bob', 'bob@example.test');
    await assertFails(
      setDoc(doc(attacker, 'users', 'dave'), {
        email: 'bob@example.test',
        name: 'Dave',
      }),
    );
  });

  test('the real two-write name update batch keeps profiles consistent', async () => {
    const db = auth('alice', 'alice@example.test');
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'alice'), { name: 'Alice Updated' });
    batch.update(doc(db, 'publicProfiles', 'alice'), {
      name: 'Alice Updated',
    });
    await assertSucceeds(batch.commit());

    const divergent = writeBatch(db);
    divergent.update(doc(db, 'users', 'alice'), { name: 'Private Name' });
    divergent.update(doc(db, 'publicProfiles', 'alice'), {
      name: 'Public Name',
    });
    await assertFails(divergent.commit());

    const bob = auth('bob', 'bob@example.test');
    const forged = writeBatch(bob);
    forged.update(doc(bob, 'users', 'alice'), { name: 'Mallory' });
    forged.update(doc(bob, 'publicProfiles', 'alice'), { name: 'Mallory' });
    await assertFails(forged.commit());
  });

  test('the real three-write email migration batch is constrained', async () => {
    const db = auth('alice', 'alice.new@example.test');
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', 'alice'), {
      email: 'alice.new@example.test',
    });
    batch.delete(doc(db, 'userLookups', 'alice@example.test'));
    batch.set(doc(db, 'userLookups', 'alice.new@example.test'), {
      user: userRef(db, 'alice'),
    });
    await assertSucceeds(batch.commit());
  });

  test('forged email migrations fail', async () => {
    const wrongTargetDb = auth('alice', 'alice.new@example.test');
    const wrongTarget = writeBatch(wrongTargetDb);
    wrongTarget.update(doc(wrongTargetDb, 'users', 'alice'), {
      email: 'alice.new@example.test',
    });
    wrongTarget.delete(doc(wrongTargetDb, 'userLookups', 'alice@example.test'));
    wrongTarget.set(
      doc(wrongTargetDb, 'userLookups', 'alice.new@example.test'),
      { user: userRef(wrongTargetDb, 'bob') },
    );
    await assertFails(wrongTarget.commit());

    const malformedDb = auth('alice', 'alice.new@example.test');
    await assertFails(
      setDoc(doc(malformedDb, 'userLookups', 'alice.new@example.test'), {
        user: userRef(malformedDb, 'alice'),
        unexpected: true,
      }),
    );

    const wrongKeyDb = auth('alice', 'alice.new@example.test');
    const wrongKey = writeBatch(wrongKeyDb);
    wrongKey.update(doc(wrongKeyDb, 'users', 'alice'), {
      email: 'alice.new@example.test',
    });
    wrongKey.delete(doc(wrongKeyDb, 'userLookups', 'alice@example.test'));
    wrongKey.set(doc(wrongKeyDb, 'userLookups', 'other@example.test'), {
      user: userRef(wrongKeyDb, 'alice'),
    });
    await assertFails(wrongKey.commit());

    const staleLookupDb = auth('alice', 'alice.new@example.test');
    const staleLookup = writeBatch(staleLookupDb);
    staleLookup.update(doc(staleLookupDb, 'users', 'alice'), {
      email: 'alice.new@example.test',
    });
    staleLookup.set(
      doc(staleLookupDb, 'userLookups', 'alice.new@example.test'),
      { user: userRef(staleLookupDb, 'alice') },
    );
    await assertFails(staleLookup.commit());

    const bob = auth('bob', 'alice.new@example.test');
    await assertFails(
      updateDoc(doc(bob, 'users', 'alice'), {
        email: 'alice.new@example.test',
      }),
    );
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
      const db = firestoreFor(context);
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

  test('membership-scoped friendship queries work', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertSucceeds(
      getDocs(
        query(
          collection(db, 'friendships'),
          where('userIds', 'array-contains', 'alice'),
        ),
      ),
    );
    await assertFails(getDocs(collection(db, 'friendships')));
  });
});

describe('games', () => {
  test('a player can create a game with registered players and a guest', async () => {
    const db = auth('alice', 'alice@example.test');
    const game = x01Game(db);
    game.players.push('Guest player');
    await assertSucceeds(setDoc(doc(db, 'games', 'new-game'), game));
  });

  test('a player can update a game with multiple valid turns', async () => {
    const db = auth('alice', 'alice@example.test');

    const turn = {
      userId: userRef(db, 'alice'),
      throws: [
        { type: 'triple', score: 20 },
        { type: 'triple', score: 20 },
        { type: 'triple', score: 20 },
      ],
      isValid: false,
    };

    await assertSucceeds(
      updateDoc(doc(db, 'games', 'alice-bob'), {
        turns: [turn, turn, turn, turn, turn],
      }),
    );
  });

  test('members can update realistic mutable game state', async () => {
    const alice = auth('alice', 'alice@example.test');
    await assertSucceeds(
      updateDoc(doc(alice, 'games', 'alice-bob'), {
        turns: [validTurn(alice, 'alice', true)],
        finished: new Date('2026-01-01T01:00:00Z'),
      }),
    );

    const bob = auth('bob', 'bob@example.test');
    await assertSucceeds(
      updateDoc(doc(bob, 'games', 'alice-bob'), {
        turns: [validTurn(bob, 'bob', false)],
      }),
    );
  });

  test('game mode and starting-score state are immutable after creation', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertFails(
      updateDoc(doc(db, 'games', 'alice-bob'), {
        options: { mode: 'x01', startingScore: 301 },
        startingScore: 301,
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'games', 'alice-bob'), {
        options: {
          mode: 'doubles',
          quickMatch: true,
          skipBull: false,
          endOnInvalid: true,
        },
        startingScore: deleteField(),
      }),
    );
  });

  test('resending an equal immutable field does not count as changing it', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertSucceeds(
      updateDoc(doc(db, 'games', 'alice-bob'), {
        players: [userRef(db, 'alice'), userRef(db, 'bob')],
        turns: [validTurn(db)],
      }),
    );
  });

  test('authorized members may persist application-defined turn data', async () => {
    const db = auth('alice', 'alice@example.test');
    const game = doc(db, 'games', 'alice-bob');
    // Firestore deliberately does not duplicate the TypeScript Turn/Throw
    // schema. The application parser sanitizes this untrusted runtime input.
    await assertSucceeds(
      updateDoc(game, {
        turns: [
          {
            userId: userRef(db, 'alice'),
            throws: [{ type: 'future-dart', score: 'application-defined' }],
            unexpected: { nested: 'data' },
          },
          null,
          { also: 'application-owned' },
        ],
      }),
    );
  });

  test('game updates enforce authorization, write contract, and resource bounds', async () => {
    const db = auth('alice', 'alice@example.test');
    const game = doc(db, 'games', 'alice-bob');
    await assertFails(
      updateDoc(game, {
        turns: { not: 'a bounded history list' },
      }),
    );
    await assertFails(
      updateDoc(game, {
        turns: Array.from({ length: 501 }, () => null),
      }),
    );
    await assertFails(
      updateDoc(game, {
        turns: [],
        owner: 'bob',
      }),
    );
    await assertFails(
      updateDoc(game, {
        options: { mode: 'x01', startingScore: 1 },
        startingScore: 1,
      }),
    );
    await assertFails(updateDoc(game, { unexpected: true }));
  });

  test('unauthenticated clients cannot update games', async () => {
    const db = firestoreFor(env.unauthenticatedContext());
    await assertFails(updateDoc(doc(db, 'games', 'alice-bob'), { turns: [] }));
  });

  test('eight registered players can create a game', async () => {
    const ids = [
      'alice',
      ...Array.from({ length: 7 }, (_, i) => `participant${i}`),
    ];
    await env.withSecurityRulesDisabled(async (context) => {
      const db = firestoreFor(context);
      for (const uid of ids.slice(1)) {
        await setDoc(doc(db, 'users', uid), {
          email: `${uid}@example.test`,
          name: uid,
        });
      }
    });

    const db = auth('alice', 'alice@example.test');
    const game = x01Game(db, 'alice', ids);
    await assertSucceeds(setDoc(doc(db, 'games', 'maximum-players'), game));
  });

  test('registered players and guests share the eight-player limit', async () => {
    const db = auth('alice', 'alice@example.test');
    const game = x01Game(db);
    game.players.push(...Array.from({ length: 6 }, (_, i) => `Guest ${i}`));
    await assertSucceeds(setDoc(doc(db, 'games', 'maximum-display'), game));

    const tooManyPlayers = x01Game(db);
    tooManyPlayers.players.push(
      ...Array.from({ length: 7 }, (_, i) => `Guest ${i}`),
    );
    await assertFails(
      setDoc(doc(db, 'games', 'mixed-above-maximum'), tooManyPlayers),
    );
  });

  test('nine registered players are rejected', async () => {
    const db = auth('alice', 'alice@example.test');
    const tooManyRegisteredIds = [
      'alice',
      ...Array.from({ length: 8 }, (_, i) => `registered${i}`),
    ];
    await assertFails(
      setDoc(
        doc(db, 'games', 'too-many-registered'),
        x01Game(db, 'alice', tooManyRegisteredIds),
      ),
    );
  });

  test('solo X01 and Doubles games can be created', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertSucceeds(
      setDoc(doc(db, 'games', 'solo-x01'), x01Game(db, 'alice', ['alice'])),
    );
    await assertSucceeds(
      setDoc(doc(db, 'games', 'solo-doubles'), doublesGame(db)),
    );
  });

  test('application-defined options are accepted but top-level fields remain constrained', async () => {
    const db = auth('alice', 'alice@example.test');
    const applicationDefinedOptions = x01Game(db, 'alice', ['alice']);
    applicationDefinedOptions.options = {
      mode: 'future-mode',
      applicationOwned: true,
    };
    applicationDefinedOptions.startingScore = 'not-a-score';
    await assertSucceeds(
      setDoc(
        doc(db, 'games', 'application-options'),
        applicationDefinedOptions,
      ),
    );

    const unknownField = x01Game(db, 'alice', ['alice']);
    unknownField.unexpected = true;
    await assertFails(setDoc(doc(db, 'games', 'unknown-field'), unknownField));
  });

  test('non-friend game membership grants no protected-data capability', async () => {
    const mallory = auth('charlie', 'charlie@example.test');
    const gameRef = doc(mallory, 'games', 'non-friend-game');
    const poisonedGame = x01Game(mallory, 'charlie', ['charlie', 'alice']);
    poisonedGame.turns = [{ arbitrary: ['application', 'data'], throws: null }];
    poisonedGame.options = null;
    await assertSucceeds(setDoc(gameRef, poisonedGame));

    await assertFails(getDoc(doc(mallory, 'users', 'alice')));
    await assertFails(
      updateDoc(doc(mallory, 'users', 'alice'), { name: 'Mallory' }),
    );
    await assertFails(
      updateDoc(doc(mallory, 'publicProfiles', 'alice'), { name: 'Mallory' }),
    );
    await assertFails(
      getDoc(doc(mallory, 'friendships', friendshipId('alice', 'bob'))),
    );
    await assertFails(
      updateDoc(doc(mallory, 'friendships', friendshipId('alice', 'bob')), {
        status: 'accepted',
      }),
    );
    await assertFails(getDocs(collection(mallory, 'userLookups')));

    // Exact lookup is intentionally available to every signed-in user who
    // already knows the email; game membership does not confer this access.
    await assertSucceeds(
      getDoc(doc(mallory, 'userLookups', 'alice@example.test')),
    );

    const alice = auth('alice', 'alice@example.test');
    await assertSucceeds(getDoc(doc(alice, 'games', 'non-friend-game')));
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

    const missingOwner = x01Game(db, 'alice', ['bob']);
    await assertFails(setDoc(doc(db, 'games', 'missing-owner'), missingOwner));
  });

  test('player references remain protected while turn schema stays application-owned', async () => {
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
    await assertSucceeds(
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

  test('a Doubles game with a guest can be saved repeatedly', async () => {
    const db = auth('alice', 'alice@example.test');
    const game = doublesGame(db);
    game.players.push('Guest 1');
    game.turns = [validTurn(db, 'alice')];
    await assertSucceeds(setDoc(doc(db, 'games', 'doubles-guest'), game));

    const guestTurn = validTurn(db, 'Guest 1');
    await assertSucceeds(
      updateDoc(doc(db, 'games', 'doubles-guest'), {
        turns: [...game.turns, guestTurn],
        finished: null,
      }),
    );
    await assertSucceeds(
      updateDoc(doc(db, 'games', 'doubles-guest'), {
        turns: [...game.turns, guestTurn, validTurn(db, 'alice')],
        finished: null,
      }),
    );
  });

  test('former friends retain access to their immutable-membership game history', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = firestoreFor(context);
      await deleteDoc(doc(db, 'friendships', friendshipId('alice', 'bob')));
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

  test('the ordered, limited, paginated membership query works', async () => {
    const db = auth('alice', 'alice@example.test');
    await assertSucceeds(
      getDocs(
        query(
          collection(db, 'games'),
          where('playerIds', 'array-contains', 'alice'),
          orderBy('started', 'desc'),
          limit(10),
        ),
      ),
    );
    const cursor = await getDoc(doc(db, 'games', 'alice-bob'));
    await assertSucceeds(
      getDocs(
        query(
          collection(db, 'games'),
          where('playerIds', 'array-contains', 'alice'),
          orderBy('started', 'desc'),
          startAfter(cursor),
          limit(10),
        ),
      ),
    );
    await assertFails(getDocs(collection(db, 'games')));
  });
});
