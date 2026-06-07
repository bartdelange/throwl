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
  FullScreenLayout: (props) =>
    require('react').createElement(
      require('react-native').View,
      null,
      props.children,
    ),
}));

jest.mock('@throwl/shared-ui', () => ({
  AppHeader: (props) =>
    require('react').createElement(
      require('react-native').Text,
      null,
      props.title,
    ),
  SwipeActions: (props) =>
    require('react').createElement(
      require('react-native').View,
      null,
      props.children,
    ),
}));

describe('PlayedGamesScreen', () => {
  it('loads played games for the signed-in user', async () => {
    jest.mocked(GameService.getOwnGames).mockResolvedValue([]);
    const { PlayedGamesScreen } = require('../../..');

    const { getByText } = render(<PlayedGamesScreen />);

    expect(getByText('PLAYED GAMES')).toBeTruthy();
    await waitFor(() =>
      expect(GameService.getOwnGames).toHaveBeenCalledWith('u1', 15),
    );
  });
});
