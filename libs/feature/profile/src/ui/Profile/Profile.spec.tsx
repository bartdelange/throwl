import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@throwl/feature-auth', () => ({
  useAuthContext: () => ({
    user: {
      type: 'user',
      id: 'u1',
      email: 'bart@example.com',
      name: 'Bart',
      friends: [],
    },
  }),
}));

jest.mock('@react-navigation/core', () => ({
  useNavigation: () => ({ popToTop: jest.fn(), replace: jest.fn() }),
}));

jest.mock('validator/es/lib/isEmail', () => jest.fn(() => true));

jest.mock('@react-native-firebase/auth', () => ({
  EmailAuthProvider: { credential: jest.fn() },
  getAuth: jest.fn(() => ({ currentUser: { email: 'bart@example.com' } })),
  signOut: jest.fn(),
}));

jest.mock('@throwl/shared-data-access-user', () => ({
  UserService: { updateEmail: jest.fn(), updateName: jest.fn() },
}));

jest.mock('@throwl/shared-layouts', () => ({
  FullScreenLayout: ({ children }: { children?: ReactNode }) =>
    require('react').createElement(
      require('react-native').View,
      null,
      children,
    ),
}));

jest.mock('@throwl/shared-theme', () => ({
  useAppTheme: () => ({ colors: { error: 'red' } }),
}));

jest.mock('@throwl/shared-ui', () => ({
  AppHeader: ({ title }: { title?: string }) =>
    require('react').createElement(require('react-native').Text, null, title),
  AppModal: () => null,
  FormInput: ({ label, value }: { label?: string; value?: string }) =>
    require('react').createElement(require('react-native').TextInput, {
      accessibilityLabel: label,
      value,
    }),
  Loader: () => null,
  LogoButton: ({ label }: { label?: string }) =>
    require('react').createElement(require('react-native').Text, null, label),
}));

describe('ProfileScreen', () => {
  it('renders the signed-in user profile form', () => {
    const { ProfileScreen } = require('./Profile');
    const { getByText, getByDisplayValue } = render(<ProfileScreen />);

    expect(getByText('Your profile')).toBeTruthy();
    expect(getByDisplayValue('Bart')).toBeTruthy();
  });
});
