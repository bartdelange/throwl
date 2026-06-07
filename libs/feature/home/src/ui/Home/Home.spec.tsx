import { render } from '@testing-library/react-native';
import { HomeScreen } from './Home';

jest.mock('@throwl/feature-auth', () => ({
  useAuthContext: () => ({ user: { id: 'u1', name: 'Bart' } }),
}));

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ push: jest.fn() }),
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
  AppLogoLight: () =>
    require('react').createElement(require('react-native').Text, null, 'Logo'),
  LogoButton: (props) =>
    require('react').createElement(
      require('react-native').Text,
      null,
      props.label,
    ),
}));

describe('HomeScreen', () => {
  it('greets the signed-in user', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Hi Bart!')).toBeTruthy();
    expect(getByText('NEW GAME')).toBeTruthy();
  });
});
