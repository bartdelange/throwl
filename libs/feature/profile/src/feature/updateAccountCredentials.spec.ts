import {
  updateEmail,
  updatePassword,
  type User as FirebaseUser,
} from '@react-native-firebase/auth';
import { UserService } from '@throwl/shared-data-access-user';
import { updateAccountCredentials } from './updateAccountCredentials';

jest.mock('@react-native-firebase/auth', () => ({
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock('@throwl/shared-data-access-user', () => ({
  UserService: { updateEmail: jest.fn() },
}));

describe('updateAccountCredentials', () => {
  const getIdToken = jest.fn().mockResolvedValue('token');
  const firebaseUser = {
    uid: 'u1',
    email: 'bart@example.com',
    getIdToken,
  } as unknown as FirebaseUser;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(updateEmail).mockResolvedValue(undefined);
    jest.mocked(updatePassword).mockResolvedValue(undefined);
    jest.mocked(UserService.updateEmail).mockResolvedValue(undefined);
  });

  const update = (email: string, password = '') =>
    updateAccountCredentials({
      firebaseUser,
      applicationEmail: 'bart@example.com',
      requestedEmail: email,
      requestedPassword: password,
    });

  it('updates only the password when the email is unchanged', async () => {
    await expect(update('bart@example.com', 'new-secret')).resolves.toEqual({
      emailChanged: false,
      passwordChanged: true,
      emailAuthChanged: false,
    });
    expect(updatePassword).toHaveBeenCalledWith(firebaseUser, 'new-secret');
    expect(updateEmail).not.toHaveBeenCalled();
    expect(getIdToken).not.toHaveBeenCalled();
    expect(UserService.updateEmail).not.toHaveBeenCalled();
  });

  it('updates Auth and Firestore identity data for an email-only change', async () => {
    await expect(update('NEW@example.com')).resolves.toEqual({
      emailChanged: true,
      passwordChanged: false,
      emailAuthChanged: true,
    });
    expect(updateEmail).toHaveBeenCalledWith(firebaseUser, 'new@example.com');
    expect(getIdToken).toHaveBeenCalledWith(true);
    expect(UserService.updateEmail).toHaveBeenCalledWith(
      'u1',
      'bart@example.com',
      'new@example.com',
    );
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('does nothing when neither credential changed', async () => {
    await expect(update(' BART@example.com ')).resolves.toEqual({
      emailChanged: false,
      passwordChanged: false,
      emailAuthChanged: false,
    });
    expect(updateEmail).not.toHaveBeenCalled();
    expect(updatePassword).not.toHaveBeenCalled();
    expect(UserService.updateEmail).not.toHaveBeenCalled();
  });

  it('updates email completely before updating the password', async () => {
    await update('new@example.com', 'new-secret');
    expect(jest.mocked(updateEmail).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(UserService.updateEmail).mock.invocationCallOrder[0],
    );
    expect(
      jest.mocked(UserService.updateEmail).mock.invocationCallOrder[0],
    ).toBeLessThan(jest.mocked(updatePassword).mock.invocationCallOrder[0]);
  });

  it('stops before password mutation when the requested email fails', async () => {
    const error = new Error('email failed');
    jest.mocked(updateEmail).mockRejectedValue(error);
    await expect(update('new@example.com', 'new-secret')).resolves.toEqual({
      emailChanged: false,
      passwordChanged: false,
      emailAuthChanged: false,
      failedField: 'email',
      error,
    });
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('reports partial success when email succeeds and password fails', async () => {
    const error = new Error('password failed');
    jest.mocked(updatePassword).mockRejectedValue(error);
    await expect(update('new@example.com', 'new-secret')).resolves.toEqual({
      emailChanged: true,
      passwordChanged: false,
      emailAuthChanged: true,
      failedField: 'password',
      error,
    });
  });

  it('reports an Auth/Firestore partial email update explicitly', async () => {
    const error = new Error('profile failed');
    jest.mocked(UserService.updateEmail).mockRejectedValue(error);
    await expect(update('new@example.com', 'new-secret')).resolves.toEqual({
      emailChanged: false,
      passwordChanged: false,
      emailAuthChanged: true,
      failedField: 'profile',
      error,
    });
    expect(updatePassword).not.toHaveBeenCalled();
  });
});
