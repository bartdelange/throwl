import { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInputInstance, View } from 'react-native';
import { useAuthContext } from '@throwl/feature-auth';
import { FullScreenLayout } from '@throwl/shared-layouts';
import { useStyles } from './styles';
import { UserService } from '@throwl/shared-data-access-user';
import {
  FormInput,
  LogoButton,
  AppModal,
  Loader,
  AppHeader,
} from '@throwl/shared-ui';
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signOut,
  type User,
} from '@react-native-firebase/auth';
import isEmail from 'validator/es/lib/isEmail';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  RootStackParamList,
  UNAUTHENTICATED_SCREEN,
} from '@throwl/shared-constants';
import { useAppTheme } from '@throwl/shared-theme';
import { updateAccountCredentials } from '../../feature/updateAccountCredentials';

export const ProfileScreen = () => {
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthContext();
  const [working, setWorking] = useState(false);
  const [email, setEmail] = useState(user?.email);
  const [name, setName] = useState(user?.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const passwordInputRef = useRef<TextInputInstance>(null);
  const confirmPasswordInputRef = useRef<TextInputInstance>(null);
  const emailInputRef = useRef<TextInputInstance>(null);
  const styles = useStyles();
  const { colors } = useAppTheme();

  useEffect(() => {
    setEmail(user?.email);
    setName(user?.name);
  }, [user]);

  useEffect(() => {
    if (user) return;
    void signOut(getAuth())
      .catch(() => undefined)
      .then(() => {
        navigator.popToTop();
        navigator.replace(UNAUTHENTICATED_SCREEN);
      });
  }, [navigator, user]);

  if (!user) {
    return <View />;
  }

  const reauthenticate = async (currentPassword: string) => {
    const firebaseUser: User | null = getAuth().currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      return false;
    }

    const cred = EmailAuthProvider.credential(
      firebaseUser.email,
      currentPassword,
    );
    try {
      await reauthenticateWithCredential(firebaseUser, cred);
      return true;
    } catch {
      return false;
    }
  };

  const updateImportantUserData = async (): Promise<boolean> => {
    setWorking(true);
    const firebaseUser: User | null = getAuth().currentUser;
    try {
      if (!firebaseUser) return false;

      const requestedEmail = email?.trim() ?? '';
      const emailChanged =
        requestedEmail.toLowerCase() !== user.email.trim().toLowerCase();
      const passwordChanged = password.length > 0;

      if (!emailChanged && !passwordChanged) return true;

      if (emailChanged && (!requestedEmail || !isEmail(requestedEmail))) {
        setError('Please enter a valid email');
        setModalOpen(true);
        return false;
      }

      if (passwordChanged && confirmPassword !== password) {
        setError('Please make sure the passwords match');
        setModalOpen(true);
        return false;
      }

      if (!(await reauthenticate(currentPassword))) {
        setError(
          'Your entered current password does not match with the one in our system',
        );
        setModalOpen(true);
        return false;
      }

      const result = await updateAccountCredentials({
        firebaseUser,
        applicationEmail: user.email,
        requestedEmail,
        requestedPassword: password,
      });

      if (result.failedField === 'profile') {
        setError(
          'Your sign-in email changed, but Throwl could not finish updating your profile. Sign in again before retrying.',
        );
        setModalOpen(true);
        return false;
      }
      if (result.failedField === 'password' && result.emailChanged) {
        setError(
          'Your email was updated, but your password could not be updated. Sign in with the new email before retrying.',
        );
        setModalOpen(true);
        return false;
      }
      if (result.failedField) {
        setError(
          `Could not update your ${result.failedField}, please try again`,
        );
        setModalOpen(true);
        return false;
      }

      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      return true;
    } finally {
      setWorking(false);
    }
  };

  const updateTrivialUserData = async () => {
    setWorking(true);
    if (!name?.length) {
      setError('Please enter a name');
      setModalOpen(true);
      setWorking(false);
      return;
    }

    try {
      await UserService.updateName(user.id, name);
    } catch {
      /* empty */
    }
    setWorking(false);
  };

  return (
    <ScrollView>
      <FullScreenLayout style={styles.layout}>
        <View style={styles.content}>
          <AppHeader title="Your profile" />
          <View style={styles.section}>
            <FormInput
              style={styles.input}
              label="NAME"
              value={name}
              onChangeText={setName}
              returnKeyType="go"
              onSubmitEditing={updateTrivialUserData}
            />
            <LogoButton label="UPDATE" onPress={updateTrivialUserData} />
          </View>
          <AppHeader title="Your security information" />
          <View style={styles.section}>
            <FormInput
              style={styles.input}
              label="CURRENT PASSWORD"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              textContentType="password"
              onSubmitEditing={() => {
                emailInputRef.current?.focus();
              }}
              returnKeyType="go"
            />
            <FormInput
              style={styles.input}
              label="EMAIL"
              value={email}
              onChangeText={setEmail}
              ref={emailInputRef}
              onSubmitEditing={() => {
                confirmPasswordInputRef.current?.focus();
              }}
              placeholder={'john@doe.com'}
              returnKeyType="next"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <FormInput
              style={styles.input}
              label="NEW PASSWORD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              ref={passwordInputRef}
              onSubmitEditing={() => {
                confirmPasswordInputRef.current?.focus();
              }}
              returnKeyType="next"
            />
            <FormInput
              style={styles.input}
              label="CONFIRM PASSWORD"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="password"
              ref={confirmPasswordInputRef}
              onSubmitEditing={updateImportantUserData}
              returnKeyType="go"
            />
            <LogoButton label="UPDATE" onPress={updateImportantUserData} />
          </View>
        </View>
        <AppModal
          visible={modalOpen}
          title="ERROR"
          titleColor={colors.error}
          titleIcon="alert-circle"
          subTitle={error}
          onDismiss={() => {
            setModalOpen(false);
          }}
        />
        <Loader working={working} />
      </FullScreenLayout>
    </ScrollView>
  );
};
