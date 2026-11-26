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
