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
  FullScreenLayout: (props) =>
    require('react').createElement(
      require('react-native').View,
      null,
      props.children,
    ),
}));

jest.mock('@throwl/shared-theme', () => ({
  useAppTheme: () => ({ colors: { error: 'red' } }),
}));

jest.mock('@throwl/shared-ui', () => ({
  AppHeader: (props) =>
    require('react').createElement(
      require('react-native').Text,
      null,
      props.title,
    ),
  AppModal: () => null,
  FormInput: (props) =>
    require('react').createElement(require('react-native').TextInput, {
      accessibilityLabel: props.label,
      value: props.value,
    }),
  Loader: () => null,
  LogoButton: (props) =>
    require('react').createElement(
      require('react-native').Text,
      null,
      props.label,
    ),
}));

describe('ProfileScreen', () => {
  it('renders the signed-in user profile form', () => {
    const { ProfileScreen } = require('./Profile');
    const { getByText, getByDisplayValue } = render(<ProfileScreen />);

    expect(getByText('Your profile')).toBeTruthy();
    expect(getByDisplayValue('Bart')).toBeTruthy();
  });
});
