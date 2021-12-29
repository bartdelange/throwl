import React from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import {
  ActivityIndicator,
  Divider,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import { AuthContext } from '~/context/AuthContext';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { makeStyles } from './styles';
import { UserService } from '~/services/user_service';
import { FormInput } from '~/components/FormInput/FormInput';
import auth from '@react-native-firebase/auth';
import isEmail from 'validator/es/lib/isEmail';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UNAUTHENTICATED_SCREEN } from '#/navigation';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import { AppModal } from '~/components/AppModal/AppModal';
import { Loader } from '~/components/Loader/Loader';

export const ProfileScreen = () => {
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = React.useContext(AuthContext);
  if (!user) {
    auth()
      .signOut()
      .finally(() => {
        navigator.popToTop();
        navigator.replace(UNAUTHENTICATED_SCREEN);
      });
    return <View />;
  }
  const [working, setWorking] = React.useState(false);
  const [email, setEmail] = React.useState<string>(user.email);
  const [name, setName] = React.useState(user.name);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string>();
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);
  const passwordInputRef = React.useRef<TextInput>(null);
  const confirmPasswordInputRef = React.useRef<TextInput>(null);
  const emailInputRef = React.useRef<TextInput>(null);
  const styles = makeStyles();
  const { colors } = useTheme();

  const reauthenticate = async (currentPassword: string) => {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      return false;
    }

    const cred = auth.EmailAuthProvider.credential(
      firebaseUser.email,
      currentPassword
    );
    try {
      await firebaseUser.reauthenticateWithCredential(cred);
      return true;
    } catch {
      return true;
    }
  };

  const updateImportantUserData = async () => {
    setWorking(true);
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) return;
    if (!(await reauthenticate(currentPassword))) {
      setError(
        'Your entered current password does not match with the one in our system'
      );
      setModalOpen(true);
      setWorking(false);
      return false;
    }

    if (email.length && !isEmail(email)) {
      setError('Please enter a valid email');
      setModalOpen(true);
      setWorking(false);
      return false;
    }

    if (password.length && confirmPassword !== password) {
      setError('Please make sure the passwords match');
      setModalOpen(true);
      setWorking(false);
      return false;
    }

    const failedFields = [];

    if (password.length) {
      try {
        await firebaseUser.updatePassword(password);
      } catch {
        failedFields.push('password');
      }
    }

    if (email.length) {
      try {
        await firebaseUser.updateEmail(email);
        await UserService.updateEmail(firebaseUser.uid, email);
      } catch {
        failedFields.push('email');
      }
    }

    if (failedFields.length > 0) {
      setError(
        `Could not update your ${failedFields.join(' and ')}, please try again`
      );
      setModalOpen(true);
    }
    setWorking(false);
  };

  const updateTrivialUserData = async () => {
    setWorking(true);
    if (!name.length) {
      setError('Please enter a name');
      setModalOpen(true);
      setWorking(false);
      return;
    }

    try {
      await UserService.updateName(user!.id, name);
    } catch {}
    setWorking(false);
  };

  return (
    <FullScreenLayout style={styles.layout}>
      <ScrollView style={styles.content}>
        <View style={[styles.header, styles.firstHeader]}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.heading}>
            Your profile
          </Text>
        </View>
        <Divider style={styles.divider} />
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
        <View style={styles.header}>
          <Text numberOfLines={2} adjustsFontSizeToFit style={styles.heading}>
            Your security information
          </Text>
        </View>
        <Divider style={styles.divider} />
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
      </ScrollView>
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
  );
};
