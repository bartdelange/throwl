import {
  addDoc,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';

import { FirebaseService } from '@throwl/shared-data-access-firebase';
import { UserService } from '@throwl/shared-data-access-user';
import { GameService } from './game_service';
import {
  DartboardScoreType,
  Game,
  GameOptions,
  GuestUser,
  MAX_GAME_PLAYERS,
  Turn,
  User,
} from '@throwl/shared-domain-models';

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = {
    // Firestore core (used by FirebaseService)
    getFirestore: jest.fn(() => ({ __db: true })),
    collection: jest.fn((_db: unknown, name: string) => ({
      __collection: { db: _db, name },
    })),

    // ops
    addDoc: jest.fn(),
    arrayRemove: jest.fn((value: unknown) => ({ __arrayRemove: value })),
    arrayUnion: jest.fn((value: unknown) => ({ __arrayUnion: value })),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),

    // query builders
    query: jest.fn((...args: unknown[]) => ({ __query: args })),
    where: jest.fn((...args: unknown[]) => ({ __where: args })),
    orderBy: jest.fn((...args: unknown[]) => ({ __orderBy: args })),
    limit: jest.fn((n: number) => ({ __limit: n })),
    startAfter: jest.fn((snap: unknown) => ({ __startAfter: snap })),

    // refs
    doc: jest.fn((col: unknown, id: string) => ({ __doc: true, col, id })),
  };

  return mockFirestore;
});

const mockFirestore = jest.requireMock('@react-native-firebase/firestore');
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'u1' } })),
}));

describe(GameService.name, () => {
  const usersCol = mockFirestore.collection(
    mockFirestore.getFirestore(),
    'users',
  );
  const gamesCol = mockFirestore.collection(
    mockFirestore.getFirestore(),
    'games',
  );

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    // Make getCollection deterministic so our doc() mocks get a real "col".
    jest
      .spyOn(FirebaseService, 'getCollection')
      .mockImplementation((name: string) => {
        if (name === 'users') return usersCol;
        if (name === 'games') return gamesCol;
        return { __col: true, name };
      });
  });

  it('stubPlayer() returns a minimal User shape for guest players', () => {
    const result = GameService.stubPlayer({
      type: 'guest_user',
      name: 'Guest 1',
    });
    expect(result).toEqual({ id: 'Guest 1', name: 'Guest 1' });
  });

  it('create() writes a new game and then returns getById(newId)', async () => {
    const getByIdSpy = jest
      .spyOn(GameService, 'getById')
      .mockResolvedValue({ id: 'g1' } as unknown as Game);

    (addDoc as jest.Mock).mockResolvedValue({ id: 'g1' });

    const players: (User | GuestUser)[] = [
      { type: 'user', id: 'u1', email: 'a@b.com', name: 'Bart', friends: [] },
      { type: 'guest_user', name: 'Guest 1' },
    ];

    const turns: Turn[] = [{ userId: 'u1', throws: [] }];

    const options: GameOptions = { mode: 'x01', startingScore: 501 };

    await expect(
      GameService.create({
        players,
        turns,
        started: new Date('2026-01-01T10:00:00Z'),
        options,
      }),
    ).resolves.toEqual({ id: 'g1' });

    expect(addDoc).toHaveBeenCalledTimes(1);
    const [colRef, payload] = (addDoc as jest.Mock).mock.calls[0];

    expect(colRef).toBe(gamesCol);
    expect(payload.createdBy).toBe('u1');
    expect(payload.playerIds).toEqual(['u1']);
    expect(payload.historyUserIds).toEqual(['u1']);

    // players mapping: user -> doc(users, id), guest -> name
    expect(payload.players).toEqual([
      { __doc: true, col: usersCol, id: 'u1' },
      'Guest 1',
    ]);

    // turns mapping: turn.userId -> doc(users, id)
    expect(payload.turns).toEqual([
      expect.objectContaining({
        userId: { __doc: true, col: usersCol, id: 'u1' },
      }),
    ]);

    // legacy mirror for x01
    expect(payload.startingScore).toBe(501);

    expect(getByIdSpy).toHaveBeenCalledWith('g1');
  });

  it('create() rejects games above the shared player limit', async () => {
    const players: GuestUser[] = Array.from(
      { length: MAX_GAME_PLAYERS + 1 },
      (_, index) => ({ type: 'guest_user', name: `Guest ${index}` }),
    );

    await expect(
      GameService.create({
        players,
        turns: [],
        started: new Date('2026-01-01T10:00:00Z'),
        options: { mode: 'x01', startingScore: 501 },
      }),
    ).rejects.toThrow(`A game supports at most ${MAX_GAME_PLAYERS} players`);
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('does not inject a non-participating creator or guests into participant IDs', async () => {
    jest
      .spyOn(GameService, 'getById')
      .mockResolvedValue({ id: 'g2' } as unknown as Game);
    (addDoc as jest.Mock).mockResolvedValue({ id: 'g2' });

    await GameService.create({
      players: [
        { type: 'user', id: 'u2', email: '', name: 'Alice', friends: [] },
        { type: 'guest_user', name: 'Guest' },
      ],
      turns: [],
      started: new Date('2026-01-01T10:00:00Z'),
      options: { mode: 'x01', startingScore: 501 },
    });

    const payload = (addDoc as jest.Mock).mock.calls[0][1];
    expect(payload.createdBy).toBe('u1');
    expect(payload.playerIds).toEqual(['u2']);
    expect(payload.historyUserIds).toEqual(['u2']);
  });

  it('update() patches a game and returns getById(id)', async () => {
    const getByIdSpy = jest
      .spyOn(GameService, 'getById')
      .mockResolvedValue({ id: 'g9' } as unknown as Game);

    await expect(
      GameService.update({
        id: 'g9',
        turns: [],
      }),
    ).resolves.toEqual({ id: 'g9' });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const [ref, patch] = (updateDoc as jest.Mock).mock.calls[0];

    expect(ref).toEqual({ __doc: true, col: gamesCol, id: 'g9' });
    expect(patch.turns).toEqual([]);
    expect(patch.finished).toBeNull();

    expect(getByIdSpy).toHaveBeenCalledWith('g9');
  });

  it('parses a valid persisted started timestamp into a Date', async () => {
    jest.spyOn(UserService, 'getPublicById').mockResolvedValue({
      type: 'user',
      id: 'u1',
      email: '',
      name: 'Alice',
    });
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        players: [{ id: 'u1' }],
        turns: [],
        started: { toDate: () => new Date('2025-02-03T12:00:00Z') },
        finished: null,
        options: { mode: 'x01', startingScore: 501 },
      }),
    });

    const game = await GameService.getById('valid-started');

    expect(game.started).toEqual(new Date('2025-02-03T12:00:00Z'));
  });

  it('surfaces an invalid persisted started timestamp from getById()', async () => {
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        players: [{ id: 'u1' }],
        turns: [],
        started: 'not-a-timestamp',
        options: { mode: 'x01', startingScore: 501 },
      }),
    });
    const profileLookup = jest.spyOn(UserService, 'getPublicById');

    await expect(GameService.getById('invalid-started')).rejects.toThrow(
      'Game invalid-started has an invalid started timestamp',
    );
    expect(profileLookup).not.toHaveBeenCalled();
  });

  it('persists, parses, and repeatedly updates a Doubles game with a guest', async () => {
    const stored = {
      createdBy: 'u1',
      playerIds: ['u1'],
      historyUserIds: ['u1'],
      players: [{ __doc: true, col: usersCol, id: 'u1' }, 'Guest 1'],
      turns: [
        {
          userId: { __doc: true, col: usersCol, id: 'Guest 1' },
          throws: [
            { type: DartboardScoreType.Double, score: 16, isValid: true },
          ],
          isValid: true,
        },
      ],
      started: { toDate: () => new Date('2026-01-01T10:00:00Z') },
      finished: null,
      options: {
        mode: 'doubles',
        quickMatch: false,
        skipBull: false,
        endOnInvalid: true,
      },
    };
    (addDoc as jest.Mock).mockResolvedValue({ id: 'doubles-guests' });
    mockFirestore.getDoc.mockImplementation(async () => ({
      exists: () => true,
      data: () => stored,
    }));
    (updateDoc as jest.Mock).mockImplementation(
      async (_ref: unknown, patch: typeof stored) =>
        Object.assign(stored, patch),
    );
    jest.spyOn(UserService, 'getPublicById').mockResolvedValue({
      type: 'user',
      id: 'u1',
      email: '',
      name: 'Player',
    });

    const created = await GameService.create({
      players: [
        { type: 'user', id: 'u1', email: '', name: 'Player', friends: [] },
        { type: 'guest_user', name: 'Guest 1' },
      ],
      turns: [
        {
          userId: 'Guest 1',
          throws: [
            { type: DartboardScoreType.Double, score: 16, isValid: true },
          ],
          isValid: true,
        },
      ],
      started: new Date('2026-01-01T10:00:00Z'),
      options: stored.options as GameOptions,
    });

    expect(created.players).toEqual([
      expect.objectContaining({ type: 'user', id: 'u1' }),
      { type: 'guest_user', name: 'Guest 1' },
    ]);
    expect(created.turns[0].userId).toBe('Guest 1');

    const firstUpdate = await GameService.update({
      id: created.id,
      turns: created.turns,
    });
    await GameService.update({ id: firstUpdate.id, turns: firstUpdate.turns });

    expect(updateDoc).toHaveBeenCalledTimes(2);
    for (const [, patch] of (updateDoc as jest.Mock).mock.calls) {
      expect(Object.keys(patch).sort()).toEqual(['finished', 'turns']);
      expect(patch.turns[0].userId.id).toBe('Guest 1');
    }
  });

  it('loads historical registered players through public profiles without friendship data', async () => {
    jest.spyOn(UserService, 'getPublicById').mockImplementation(async (id) => ({
      type: 'user',
      id,
      email: '',
      name: id === 'u1' ? 'Alice' : 'Bob',
    }));
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'historical-game',
          data: () => ({
            playerIds: ['u1', 'u2'],
            historyUserIds: ['u1', 'u2'],
            players: [
              { __doc: true, col: usersCol, id: 'u1' },
              { __doc: true, col: usersCol, id: 'u2' },
            ],
            turns: [
              {
                userId: { __doc: true, col: usersCol, id: 'u2' },
                username: 'Bob',
                throws: [],
              },
            ],
            started: { toDate: () => new Date('2025-01-01T10:00:00Z') },
            finished: { toDate: () => new Date('2025-01-01T10:30:00Z') },
            startingScore: 501,
          }),
        },
      ],
    });

    await expect(GameService.getPlayedGames('u1')).resolves.toEqual([
      expect.objectContaining({
        id: 'historical-game',
        players: [
          expect.objectContaining({ id: 'u1', name: 'Alice' }),
          expect.objectContaining({ id: 'u2', name: 'Bob' }),
        ],
        turns: [expect.objectContaining({ userId: 'u2', username: 'Bob' })],
        options: { mode: 'x01', startingScore: 501 },
      }),
    ]);
    expect(UserService.getPublicById).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledWith(
      gamesCol,
      expect.objectContaining({
        __where: ['historyUserIds', 'array-contains', 'u1'],
      }),
      expect.objectContaining({ __orderBy: ['started', 'desc'] }),
    );
    expect(where).toHaveBeenCalledWith(
      'historyUserIds',
      'array-contains',
      'u1',
    );
    expect(orderBy).toHaveBeenCalledWith('started', 'desc');
  });

  it('loads registered and guest participants without resolving the guest', async () => {
    jest.spyOn(UserService, 'getPublicById').mockResolvedValue({
      type: 'user',
      id: 'u1',
      email: '',
      name: 'Alice',
    });
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'guest-history',
          data: () => ({
            playerIds: ['u1'],
            players: [{ id: 'u1' }, 'Guest'],
            turns: [{ userId: { id: 'Guest' }, throws: [] }],
            started: { toDate: () => new Date('2025-01-01T10:00:00Z') },
            finished: null,
            options: { mode: 'doubles' },
          }),
        },
      ],
    });

    const [game] = await GameService.getPlayedGames('u1');
    expect(game.players).toEqual([
      expect.objectContaining({ id: 'u1', name: 'Alice' }),
      { type: 'guest_user', name: 'Guest' },
    ]);
    expect(game.turns).toEqual([{ userId: 'Guest', throws: [] }]);
    expect(UserService.getPublicById).toHaveBeenCalledTimes(1);
  });

  it('preserves the history pagination cursor and limit', async () => {
    const cursor = { exists: () => true, id: 'cursor' };
    mockFirestore.getDoc.mockResolvedValue(cursor);
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await GameService.getPlayedGames('u1', 5, 'cursor');

    expect(startAfter).toHaveBeenCalledWith(cursor);
    expect(limit).toHaveBeenCalledWith(5);
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ __startAfter: cursor }),
    );
  });

  it('isolates a game with missing started while returning valid history', async () => {
    jest.spyOn(UserService, 'getPublicById').mockImplementation(async (id) => {
      if (id === 'missing') throw new Error('missing public profile');
      return { type: 'user', id, email: '', name: 'Player' };
    });

    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'missing-started',
          data: () => ({
            players: [{ id: 'u1' }],
            turns: [],
            options: { mode: 'x01', startingScore: 501 },
          }),
        },
        {
          id: 'safe-game',
          data: () => ({
            players: [{ id: 'u1' }],
            turns: [
              null,
              { userId: { id: 'u1' }, throws: 'not-an-array' },
              {
                userId: { id: 'u1' },
                throws: [{ type: 'quadruple', score: 20 }],
              },
              {
                userId: { id: 'u1' },
                throws: [{ type: 'triple', score: 20, ignored: true }],
                isValid: false,
                ignored: true,
              },
            ],
            options: { mode: 'x01', startingScore: Number.NaN },
            startingScore: 301,
            started: { toDate: () => new Date('2026-01-01T10:00:00Z') },
            finished: {
              toDate: () => {
                throw new Error('invalid timestamp');
              },
            },
          }),
        },
      ],
    });

    await expect(GameService.getPlayedGames('u1')).resolves.toEqual([
      expect.objectContaining({
        id: 'safe-game',
        finished: undefined,
        options: { mode: 'x01', startingScore: 301 },
        turns: [
          {
            userId: 'u1',
            throws: [{ type: 'triple', score: 20 }],
            isValid: false,
          },
        ],
      }),
    ]);
  });

  it('isolates missing public identity and malformed player entries per game', async () => {
    jest.spyOn(UserService, 'getPublicById').mockImplementation(async (id) => {
      if (id === 'missing') throw new Error('missing public profile');
      return { type: 'user', id, email: '', name: 'Alice' };
    });
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'missing-profile',
          data: () => ({ players: [{ id: 'missing' }] }),
        },
        {
          id: 'malformed-player',
          data: () => ({ players: [{ path: '/users/u2' }] }),
        },
        {
          id: 'valid-history',
          data: () => ({
            playerIds: ['u1'],
            players: [{ id: 'u1' }],
            turns: [],
            started: { toDate: () => new Date('2025-01-01T10:00:00Z') },
            finished: null,
            options: { mode: 'x01', startingScore: 301 },
          }),
        },
      ],
    });

    await expect(GameService.getPlayedGames('u1')).resolves.toEqual([
      expect.objectContaining({ id: 'valid-history' }),
    ]);
  });

  it('removeFromHistory() atomically removes only the requested user', async () => {
    await GameService.removeFromHistory('g2', 'u1');
    expect(arrayRemove).toHaveBeenCalledWith('u1');
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: true, col: gamesCol, id: 'g2' },
      { historyUserIds: { __arrayRemove: 'u1' } },
    );
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it('restoreToHistory() atomically restores only the requested user', async () => {
    await GameService.restoreToHistory('g2', 'u1');
    expect(arrayUnion).toHaveBeenCalledWith('u1');
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: true, col: gamesCol, id: 'g2' },
      { historyUserIds: { __arrayUnion: 'u1' } },
    );
  });

  it('physicallyDeleteGame() removes a game document', async () => {
    await GameService.physicallyDeleteGame('g2');
    expect(deleteDoc).toHaveBeenCalledTimes(1);
    expect(deleteDoc).toHaveBeenCalledWith({
      __doc: true,
      col: gamesCol,
      id: 'g2',
    });
  });
});
