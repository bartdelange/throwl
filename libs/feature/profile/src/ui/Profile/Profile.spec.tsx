import type { ReactNode } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockUpdateAccountCredentials = jest.fn();
const mockReauthenticateWithCredential = jest.fn(() => Promise.resolve());
const mockFirebaseUser = {
  uid: 'u1',
  email: 'bart@example.com',
  getIdToken: jest.fn(() => Promise.resolve('token')),
};

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
  getAuth: jest.fn(() => ({ currentUser: mockFirebaseUser })),
  reauthenticateWithCredential: mockReauthenticateWithCredential,
  signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../feature/updateAccountCredentials', () => ({
  updateAccountCredentials: mockUpdateAccountCredentials,
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
  AppModal: ({
    visible,
    subTitle,
  }: {
    visible?: boolean;
    subTitle?: string;
  }) =>
    visible
      ? require('react').createElement(
          require('react-native').Text,
          null,
          subTitle,
        )
      : null,
  FormInput: ({
    label,
    value,
    onChangeText,
  }: {
    label?: string;
    value?: string;
    onChangeText?: (value: string) => void;
  }) =>
    require('react').createElement(require('react-native').TextInput, {
      accessibilityLabel: label,
      value,
      onChangeText,
    }),
  Loader: () => null,
  LogoButton: ({ label, onPress }: { label?: string; onPress?: () => void }) =>
    require('react').createElement(
      require('react-native').Text,
      { onPress },
      label,
    ),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateAccountCredentials.mockResolvedValue({
      emailChanged: false,
      passwordChanged: true,
      emailAuthChanged: false,
    });
  });

  const renderProfile = () => {
    const { ProfileScreen } = require('./Profile');
    return render(<ProfileScreen />);
  };

  it('renders the signed-in user profile form', () => {
    const { getByText, getByDisplayValue } = renderProfile();

    expect(getByText('Your profile')).toBeTruthy();
    expect(getByDisplayValue('Bart')).toBeTruthy();
  });

  it('submits a password-only update without requesting an email change', async () => {
    const { getByLabelText, getAllByText, queryByText } = renderProfile();
    fireEvent.changeText(getByLabelText('CURRENT PASSWORD'), 'old-secret');
    fireEvent.changeText(getByLabelText('NEW PASSWORD'), 'new-secret');
    fireEvent.changeText(getByLabelText('CONFIRM PASSWORD'), 'new-secret');
    fireEvent.press(getAllByText('UPDATE')[1]);

    await waitFor(() =>
      expect(mockUpdateAccountCredentials).toHaveBeenCalled(),
    );
    expect(mockUpdateAccountCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedEmail: 'bart@example.com',
        requestedPassword: 'new-secret',
      }),
    );
    expect(queryByText(/Could not update/)).toBeNull();
  });

  it('does not reauthenticate or mutate when nothing changed', async () => {
    const { getAllByText } = renderProfile();
    fireEvent.press(getAllByText('UPDATE')[1]);
    await waitFor(() =>
      expect(mockUpdateAccountCredentials).not.toHaveBeenCalled(),
    );
    expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
  });

  it('reports combined-update partial success accurately', async () => {
    mockUpdateAccountCredentials.mockResolvedValue({
      emailChanged: true,
      passwordChanged: false,
      emailAuthChanged: true,
      failedField: 'password',
    });
    const { getByLabelText, getAllByText, getByText } = renderProfile();
    fireEvent.changeText(getByLabelText('CURRENT PASSWORD'), 'old-secret');
    fireEvent.changeText(getByLabelText('EMAIL'), 'new@example.com');
    fireEvent.changeText(getByLabelText('NEW PASSWORD'), 'new-secret');
    fireEvent.changeText(getByLabelText('CONFIRM PASSWORD'), 'new-secret');
    fireEvent.press(getAllByText('UPDATE')[1]);

    await waitFor(() =>
      expect(
        getByText(
          'Your email was updated, but your password could not be updated. Sign in with the new email before retrying.',
        ),
      ).toBeTruthy(),
    );
  });
});
