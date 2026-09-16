import type { ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
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
  GameService: { getOwnGames: jest.fn(), delete: jest.fn() },
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
  SwipeActions: ({ children }: { children?: ReactNode }) =>
    require('react').createElement(
      require('react-native').View,
      null,
      children,
    ),
}));

describe('PlayedGamesScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads played games for the signed-in user', async () => {
    jest.mocked(GameService.getOwnGames).mockResolvedValue([]);
    const { PlayedGamesScreen } = require('../../..');

    const { getByText } = render(<PlayedGamesScreen />);

    expect(getByText('PLAYED GAMES')).toBeTruthy();
    await waitFor(() =>
      expect(GameService.getOwnGames).toHaveBeenCalledWith('u1', 15),
    );
  });

  it('contains history query failures and offers a retry state', async () => {
    jest
      .mocked(GameService.getOwnGames)
      .mockRejectedValue(new Error('firestore index missing'));
    const { PlayedGamesScreen } = require('../../..');

    const { getByText } = render(<PlayedGamesScreen />);

    await waitFor(() =>
      expect(
        getByText('Could not load played games. Pull to retry.'),
      ).toBeTruthy(),
    );
  });
});
