import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuthContext } from './AuthContext';
import { signInWithEmailAndPassword } from '@react-native-firebase/auth';

jest.mock('@throwl/shared-data-access-user', () => ({
  UserService: {
    getById: jest.fn(),
    listenToUserChanges: jest.fn(() => jest.fn()),
    create: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({ auth: true })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

const Consumer = () => {
  const { login } = useAuthContext();
  return (
    <Text onPress={() => void login('bart@example.com', 'secret')}>
      Sign in
    </Text>
  );
};

describe('AuthProvider', () => {
  it('exposes a login action through context', () => {
    const { getByText } = render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    fireEvent.press(getByText('Sign in'));

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      { auth: true },
      'bart@example.com',
      'secret',
    );
  });
});
