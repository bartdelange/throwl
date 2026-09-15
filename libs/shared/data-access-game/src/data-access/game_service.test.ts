import {
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
} from '@react-native-firebase/firestore';

import { FirebaseService } from '@throwl/shared-data-access-firebase';
import { UserService } from '@throwl/shared-data-access-user';
import { GameService } from './game_service';
import {
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
    expect(payload.owner).toBe('u1');
    expect(payload.playerIds).toEqual(['u1']);

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

  it('isolates malformed remote games and sanitizes application-owned data', async () => {
    jest.spyOn(UserService, 'getPublicById').mockImplementation(async (id) => {
      if (id === 'missing') throw new Error('missing public profile');
      return { type: 'user', id, email: '', name: 'Player' };
    });

    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'poisoned-player',
          data: () => ({ players: [{ id: 'missing' }] }),
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

    await expect(GameService.getOwnGames('u1')).resolves.toEqual([
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

  it('delete() removes a game document', async () => {
    await GameService.delete('g2');
    expect(deleteDoc).toHaveBeenCalledTimes(1);
    expect(deleteDoc).toHaveBeenCalledWith({
      __doc: true,
      col: gamesCol,
      id: 'g2',
    });
  });
});
