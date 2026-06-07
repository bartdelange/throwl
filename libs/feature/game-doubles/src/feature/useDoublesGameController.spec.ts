import { renderHook } from '@testing-library/react-native';
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
