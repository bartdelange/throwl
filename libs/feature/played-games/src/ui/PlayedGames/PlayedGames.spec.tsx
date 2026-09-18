import type { ReactNode } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { GameService } from '@throwl/shared-data-access-game';

jest.mock('@throwl/feature-auth', () => ({
  useAuthContext: () => ({ user: { id: 'u1', name: 'Bart' } }),
}));

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ push: jest.fn() }),
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => ({
  MaterialDesignIcons: () => null,
}));

jest.mock('@throwl/shared-theme', () => ({
  useAppTheme: () => ({ colors: { primary: '#02314e' } }),
}));

jest.mock('@throwl/shared-data-access-game', () => ({
  GameService: { getPlayedGames: jest.fn(), removeFromHistory: jest.fn() },
}));

jest.mock('@throwl/shared-layouts', () => ({
  FullScreenLayout: ({ children }: { children?: ReactNode }) =>
    require('react').createElement(
      require('react-native').View,
      null,
      children,
    ),
}));

jest.mock('@throwl/shared-ui', () => ({
  AppHeader: ({ title }: { title?: string }) =>
    require('react').createElement(require('react-native').Text, null, title),
  SwipeActions: ({
    children,
    rightActions,
  }: {
    children?: ReactNode;
    rightActions?: { onPress: () => Promise<void> }[];
  }) =>
    require('react').createElement(
      require('react-native').View,
      null,
      children,
      require('react').createElement(
        require('react-native').Text,
        { onPress: rightActions?.[0].onPress },
        'Remove',
      ),
    ),
}));

describe('PlayedGamesScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads played games for the signed-in user', async () => {
    jest.mocked(GameService.getPlayedGames).mockResolvedValue([]);
    const { PlayedGamesScreen } = require('../../..');

    const { getByText } = render(<PlayedGamesScreen />);

    expect(getByText('PLAYED GAMES')).toBeTruthy();
    await waitFor(() =>
      expect(GameService.getPlayedGames).toHaveBeenCalledWith('u1', 15),
    );
  });

  it('contains history query failures and offers a retry state', async () => {
    jest
      .mocked(GameService.getPlayedGames)
      .mockRejectedValue(new Error('firestore index missing'));
    const { PlayedGamesScreen } = require('../../..');

    const { getByText } = render(<PlayedGamesScreen />);

    await waitFor(() =>
      expect(
        getByText('Could not load played games. Pull to retry.'),
      ).toBeTruthy(),
    );
  });

  it('removes a swiped game locally only after history removal succeeds', async () => {
    let resolveRemoval: (() => void) | undefined;
    jest.mocked(GameService.getPlayedGames).mockResolvedValue([
      {
        id: 'g1',
        players: [],
        turns: [],
        started: new Date('2026-01-01T10:00:00Z'),
        options: { mode: 'x01', startingScore: 501 },
      },
    ]);
    jest
      .mocked(GameService.removeFromHistory)
      .mockImplementation(
        () => new Promise<void>((resolve) => (resolveRemoval = resolve)),
      );
    const { PlayedGamesScreen } = require('../../..');
    const { getByText, queryByText } = render(<PlayedGamesScreen />);

    await waitFor(() => expect(getByText('Unfinished game')).toBeTruthy());
    fireEvent.press(getByText('Remove'));
    expect(GameService.removeFromHistory).toHaveBeenCalledWith('g1', 'u1');
    expect(queryByText('Unfinished game')).toBeTruthy();

    await act(async () => resolveRemoval?.());
    await waitFor(() => expect(queryByText('Unfinished game')).toBeNull());
  });
});
