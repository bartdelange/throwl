import {
  updateEmail,
  updatePassword,
  type User as FirebaseUser,
} from '@react-native-firebase/auth';
import { UserService } from '@throwl/shared-data-access-user';

export type AccountCredentialUpdate = {
  emailChanged: boolean;
  passwordChanged: boolean;
  emailAuthChanged: boolean;
  failedField?: 'email' | 'password' | 'profile';
  error?: unknown;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function updateAccountCredentials({
  firebaseUser,
  applicationEmail,
  requestedEmail,
  requestedPassword,
}: {
  firebaseUser: FirebaseUser;
  applicationEmail: string;
  requestedEmail: string;
  requestedPassword: string;
}): Promise<AccountCredentialUpdate> {
  const oldEmail = firebaseUser.email ?? applicationEmail;
  const nextEmail = normalizeEmail(requestedEmail);
  const emailRequested = normalizeEmail(oldEmail) !== nextEmail;
  const passwordRequested = requestedPassword.length > 0;
  let emailChanged = false;

  if (emailRequested) {
    try {
      await updateEmail(firebaseUser, nextEmail);
      emailChanged = true;
      await firebaseUser.getIdToken(true);
      await UserService.updateEmail(firebaseUser.uid, oldEmail, nextEmail);
    } catch (error) {
      return {
        emailChanged: false,
        passwordChanged: false,
        emailAuthChanged: emailChanged,
        failedField: emailChanged ? 'profile' : 'email',
        error,
      };
    }
  }

  if (passwordRequested) {
    try {
      await updatePassword(firebaseUser, requestedPassword);
    } catch (error) {
      return {
        emailChanged,
        passwordChanged: false,
        emailAuthChanged: emailChanged,
        failedField: 'password',
        error,
      };
    }
  }

  return {
    emailChanged,
    passwordChanged: passwordRequested,
    emailAuthChanged: emailChanged,
  };
}
