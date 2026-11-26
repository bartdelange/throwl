import { useState } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { DartboardScoreType, Turn } from '@throwl/shared-domain-models';
import { useX01GameController } from './useX01GameController';

const players = [{ id: 'u1', name: 'Bart' }];

describe('useX01GameController', () => {
  it('starts a game for the first player', () => {
    const { result } = renderHook(() =>
      useX01GameController({
        players,
        setPlayers: jest.fn(),
        startingScore: 501,
        finishers: {},
        scoreTableRef: { current: null },
        persistGame: jest.fn(),
      }),
    );

    expect(result.current.currentTurn.userId).toBe('u1');
    expect(result.current.activePlayerIndex).toBe(0);
    expect(result.current.isGameFinished).toBe(false);
  });
});
const teamPlayers = ['Jan', 'Klaas', 'Piet', 'Bart'].map((name) => ({
  id: name,
  name,
}));
const teams = [{ members: ['Jan', 'Piet'] }, { members: ['Klaas', 'Bart'] }];
const miss = { type: DartboardScoreType.Out, score: 0 };

it('uses a teammate’s remaining score for busts, checkout and winning undo', () => {
  const persistGame = jest.fn();
  const setPlayers = jest.fn();
  const start: Turn[] = [
    {
      userId: 'Jan',
      throws: Array(3).fill({ type: DartboardScoreType.Single, score: 20 }),
      isValid: true,
    },
    { userId: 'Klaas', throws: [miss, miss, miss], isValid: true },
  ];
  const { result } = renderHook(() =>
    useX01GameController({
      players: teamPlayers,
      teams,
      setPlayers,
      startingScore: 101,
      finishers: {
        41: [
          { type: DartboardScoreType.Single, score: 1 },
          { type: DartboardScoreType.Double, score: 20 },
        ],
      },
      activeGame: { id: 'team', turns: start },
      scoreTableRef: { current: null },
      persistGame,
    }),
  );
  expect(result.current.currentTurn.userId).toBe('Piet');
  expect(result.current.turnNeeded[0]?.score).toBe(1);
  act(() => result.current.dropOutUser('Jan'));
  expect(setPlayers).not.toHaveBeenCalled();

  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Triple, score: 20 }),
  );
  expect(result.current.currentTurn.userId).toBe('Bart');
  expect(persistGame).toHaveBeenLastCalledWith(
    [...start, expect.objectContaining({ userId: 'Piet', isValid: false })],
    false,
  );
  act(() => result.current.undoThrow());
  expect(result.current.currentTurn).toMatchObject({
    userId: 'Piet',
    isValid: true,
  });
  expect(result.current.turnNeeded[0]?.score).toBe(1);

  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Single, score: 1 }),
  );
  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Double, score: 20 }),
  );
  expect(result.current.isGameFinished).toBe(true);
  expect(persistGame).toHaveBeenLastCalledWith(
    [...start, expect.objectContaining({ userId: 'Piet', isValid: true })],
    true,
  );

  act(() => result.current.undoThrow());
  expect(result.current.isGameFinished).toBe(false);
  expect(result.current.currentTurn).toMatchObject({
    userId: 'Piet',
    throws: [{ type: DartboardScoreType.Single, score: 1 }],
  });
  expect(persistGame).toHaveBeenLastCalledWith(start, false);
});

it('revalidates a reopened individual visit after undoing its bust dart', () => {
  const persistGame = jest.fn();
  const { result } = renderHook(() =>
    useX01GameController({
      players,
      setPlayers: jest.fn(),
      startingScore: 40,
      finishers: { 22: [{ type: DartboardScoreType.Double, score: 11 }] },
      scoreTableRef: { current: null },
      persistGame,
    }),
  );
  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Single, score: 18 }),
  );
  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Triple, score: 7 }),
  );
  expect(persistGame).toHaveBeenLastCalledWith(
    [expect.objectContaining({ isValid: false })],
    false,
  );
  act(() => result.current.undoThrow());
  expect(result.current.currentTurn).toMatchObject({
    userId: 'u1',
    isValid: true,
  });
  expect(result.current.turnNeeded[1]?.score).toBe(11);
});

describe.each([
  [['AC', 'BD'], 'ABCD'],
  [['AD', 'BE', 'CF'], 'ABCDEF'],
  [['ACE', 'BDF'], 'ABCDEF'],
  [['AE', 'BF', 'CG', 'DH'], 'ABCDEFGH'],
  [['ACEG', 'BDFH'], 'ABCDEFGH'],
])('rotation and resume for roster %j', (roster, expectedOrder) => {
  it('plays a full round, discards a partial visit on resume, and undoes across the boundary', () => {
    const rosterPlayers = [...expectedOrder]
      .reverse()
      .map((id) => ({ id, name: id }));
    const teams = roster.map((members) => ({ members: [...members] }));
    const persistGame = jest.fn();
    const miss = { type: DartboardScoreType.Out, score: 0 };
    const mount = (activeGame?: { id: string; turns: Turn[] }) =>
      renderHook(() =>
        useX01GameController({
          players: rosterPlayers,
          teams,
          setPlayers: jest.fn(),
          activeGame,
          persistGame,
          scoreTableRef: { current: null },
          startingScore: 501,
          finishers: {},
        }),
      );
    const session = mount();
    for (const player of expectedOrder) {
      expect(session.result.current.currentTurn.userId).toBe(player);
      for (let dart = 0; dart < 3; dart++)
        act(() => session.result.current.onThrow(miss));
    }
    expect(persistGame).toHaveBeenCalledTimes(expectedOrder.length);
    const savedTurns = session.result.current.turns;
    act(() => session.result.current.onThrow(miss));
    act(() => session.result.current.undoThrow());
    expect(persistGame).toHaveBeenCalledTimes(expectedOrder.length);
    act(() => session.result.current.onThrow(miss));
    session.unmount();
    const reopened = mount({ id: 'saved', turns: savedTurns });
    expect(reopened.result.current.currentTurn).toMatchObject({
      userId: expectedOrder[0],
      throws: [],
    });
    act(() => reopened.result.current.undoThrow());
    expect(reopened.result.current.currentTurn).toMatchObject({
      userId: expectedOrder.at(-1),
      throws: [miss, miss],
    });
    expect(persistGame).toHaveBeenLastCalledWith(
      savedTurns.slice(0, -1),
      false,
    );
  });
});

it('preserves the current thrower when another individual drops out', () => {
  const persistGame = jest.fn();
  const miss = { type: DartboardScoreType.Out, score: 0 };
  const { result } = renderHook(() => {
    const [players, setPlayers] = useState(
      ['A', 'B', 'C'].map((id) => ({ id, name: id })),
    );
    return useX01GameController({
      players,
      setPlayers,
      scoreTableRef: { current: null },
      persistGame,
      startingScore: 501,
      finishers: {},
    });
  });
  for (let dart = 0; dart < 3; dart++) act(() => result.current.onThrow(miss));
  act(() => result.current.dropOutUser('C'));
  expect(result.current.currentTurn.userId).toBe('B');
  act(() => result.current.undoThrow());
  expect(result.current.currentTurn).toMatchObject({
    userId: 'A',
    throws: [miss, miss],
  });
  act(() => result.current.onThrow(miss));
  expect(result.current.currentTurn.userId).toBe('B');
});
