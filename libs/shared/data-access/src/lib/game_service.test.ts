import { addDoc, deleteDoc, updateDoc } from '@react-native-firebase/firestore';

import { FirebaseService } from './firebase_service';
import { GameService } from './game_service';
import {
  Game,
  GameOptions,
  GuestUser,
  Turn,
  User,
} from '@throwl/shared-domain-models';

jest.mock('@react-native-firebase/firestore', () => ({
  // Firestore core (used by FirebaseService)
  getFirestore: jest.fn(() => ({ __db: true })),
  collection: jest.fn((_db: unknown, name: string) => ({ __col: true, name })),

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
}));

describe(GameService.name, () => {
  const usersCol = { __col: true, name: 'users' };
  const gamesCol = { __col: true, name: 'games' };

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

  it('update() patches a game and returns getById(id)', async () => {
    const getByIdSpy = jest
      .spyOn(GameService, 'getById')
      .mockResolvedValue({ id: 'g9' } as unknown as Game);

    const options: GameOptions = { mode: 'x01', startingScore: 301 };

    await expect(
      GameService.update({
        id: 'g9',
        players: [
          {
            type: 'user',
            id: 'u1',
            email: 'a@b.com',
            name: 'Bart',
            friends: [],
          },
        ],
        turns: [],
        options,
      }),
    ).resolves.toEqual({ id: 'g9' });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const [ref, patch] = (updateDoc as jest.Mock).mock.calls[0];

    expect(ref).toEqual({ __doc: true, col: gamesCol, id: 'g9' });
    expect(patch.players).toEqual([{ __doc: true, col: usersCol, id: 'u1' }]);
    expect(patch.turns).toEqual([]);
    expect(patch.options).toBe(options);
    expect(patch.startingScore).toBe(301);

    expect(getByIdSpy).toHaveBeenCalledWith('g9');
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
