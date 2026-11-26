import { useState } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { DartboardScoreType, Turn } from '@throwl/shared-domain-models';
import { useDoublesGameController } from './useDoublesGameController';

const players = [{ id: 'u1', name: 'Bart' }];

describe('useDoublesGameController', () => {
  it('starts a doubles game for the first player', () => {
    const { result } = renderHook(() =>
      useDoublesGameController({
        players,
        setPlayers: jest.fn(),
        options: {
          mode: 'doubles',
          quickMatch: false,
          skipBull: false,
          endOnInvalid: false,
        },
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

it('resumes a shared ladder and keeps earlier hits when the visit ends on a wrong target', () => {
  const persistGame = jest.fn();
  const start: Turn[] = [
    {
      userId: 'Jan',
      throws: [{ type: DartboardScoreType.Double, score: 20 }, miss, miss],
    },
    { userId: 'Klaas', throws: [miss, miss, miss] },
  ];
  const { result } = renderHook(() =>
    useDoublesGameController({
      players: teamPlayers,
      teams,
      setPlayers: jest.fn(),
      options: {
        mode: 'doubles',
        quickMatch: true,
        skipBull: true,
        endOnInvalid: true,
      },
      activeGame: { id: 'team', turns: start },
      scoreTableRef: { current: null },
      persistGame,
    }),
  );
  expect(result.current.currentTurn.userId).toBe('Piet');
  expect(result.current.turnNeeded[0]?.score).toBe(19);
  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Double, score: 19 }),
  );
  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Double, score: 15 }),
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
  expect(result.current.turnNeeded[1]?.score).toBe(18);
  act(() => result.current.onThrow(miss));
  act(() => result.current.onThrow(miss));
  for (let dart = 0; dart < 3; dart++) act(() => result.current.onThrow(miss));
  expect(result.current.currentTurn.userId).toBe('Jan');
  expect(result.current.turnNeeded[0]?.score).toBe(18);
});

it('wins immediately when the active player hits the team’s last target', () => {
  const persistGame = jest.fn();
  const hits = (userId: string, ...scores: number[]): Turn => ({
    userId,
    throws: scores.map((score) => ({ type: DartboardScoreType.Double, score })),
    isValid: true,
  });
  const misses = (userId: string): Turn => ({
    userId,
    throws: [miss, miss, miss],
    isValid: true,
  });
  const turns = [
    hits('Jan', 20, 19, 18),
    misses('Klaas'),
    hits('Piet', 17, 16, 15),
    misses('Bart'),
    hits('Jan', 14, 13, 12),
    misses('Klaas'),
  ];
  const { result } = renderHook(() =>
    useDoublesGameController({
      players: teamPlayers,
      teams,
      setPlayers: jest.fn(),
      options: {
        mode: 'doubles',
        quickMatch: true,
        skipBull: true,
        endOnInvalid: true,
      },
      activeGame: { id: 'team', turns },
      scoreTableRef: { current: null },
      persistGame,
    }),
  );
  expect(result.current.currentTurn.userId).toBe('Piet');
  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Double, score: 11 }),
  );
  act(() =>
    result.current.onThrow({ type: DartboardScoreType.Double, score: 10 }),
  );
  expect(result.current.isGameFinished).toBe(true);
  expect(persistGame).toHaveBeenLastCalledWith(
    [...turns, expect.objectContaining({ userId: 'Piet' })],
    true,
  );
  act(() => result.current.undoThrow());
  expect(result.current.currentTurn.userId).toBe('Piet');
  expect(result.current.turnNeeded[1]?.score).toBe(10);
  expect(persistGame).toHaveBeenLastCalledWith(turns, false);
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
        useDoublesGameController({
          players: rosterPlayers,
          teams,
          setPlayers: jest.fn(),
          activeGame,
          persistGame,
          scoreTableRef: { current: null },
          options: {
            mode: 'doubles',
            quickMatch: true,
            skipBull: true,
            endOnInvalid: true,
          },
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
    return useDoublesGameController({
      players,
      setPlayers,
      scoreTableRef: { current: null },
      persistGame,
      options: {
        mode: 'doubles',
        quickMatch: true,
        skipBull: true,
        endOnInvalid: true,
      },
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
