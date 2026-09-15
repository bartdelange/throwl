import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuthContext } from './AuthContext';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import { UserService } from '@throwl/shared-data-access-user';

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
  signOut: jest.fn(() => Promise.resolve()),
}));

const Consumer = () => {
  const { login, register } = useAuthContext();
  return (
    <>
      <Text onPress={() => void login('bart@example.com', 'secret')}>
        Sign in
      </Text>
      <Text
        onPress={() => void register('new@example.com', 'secret', 'New User')}
      >
        Register
      </Text>
    </>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => jest.clearAllMocks());

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

  it('does not read the user document while registration is provisioning it', async () => {
    let authListener: ((user: { uid: string }) => Promise<void>) | undefined;
    jest.mocked(onAuthStateChanged).mockImplementation((_auth, listener) => {
      authListener = listener as (user: { uid: string }) => Promise<void>;
      return jest.fn();
    });
    jest.mocked(createUserWithEmailAndPassword).mockImplementation(async () => {
      await authListener?.({ uid: 'new-user' });
      return { user: { uid: 'new-user' } } as never;
    });
    jest.mocked(UserService.create).mockResolvedValue({
      type: 'user',
      id: 'new-user',
      email: 'new@example.com',
      name: 'New User',
      friends: [],
    });

    const { getByText } = render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    fireEvent.press(getByText('Register'));

    await waitFor(() => expect(UserService.create).toHaveBeenCalled());
    expect(UserService.getById).not.toHaveBeenCalled();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('contains auth-listener lookup failures', async () => {
    let authListener: ((user: { uid: string }) => Promise<void>) | undefined;
    jest.mocked(onAuthStateChanged).mockImplementation((_auth, listener) => {
      authListener = listener as (user: { uid: string }) => Promise<void>;
      return jest.fn();
    });
    jest.mocked(UserService.getById).mockRejectedValue(new Error('missing'));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await expect(
      act(() => authListener?.({ uid: 'orphan' })),
    ).resolves.toBeUndefined();
  });

  it('signs out and rejects registration when provisioning fails', async () => {
    jest.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: { uid: 'new-user' },
    } as never);
    jest
      .mocked(UserService.create)
      .mockRejectedValue(new Error('provisioning failed'));
    let register: ReturnType<typeof useAuthContext>['register'] = async () =>
      undefined;
    const Capture = () => {
      register = useAuthContext().register;
      return null;
    };
    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
    );

    await expect(
      register('new@example.com', 'secret', 'New User'),
    ).rejects.toThrow('provisioning failed');
    expect(signOut).toHaveBeenCalled();
  });
});
