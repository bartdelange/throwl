import { renderHook } from '@testing-library/react-native';
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
