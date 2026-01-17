import { useNavigation } from '@react-navigation/core';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppModal } from '../../../components/AppModal/AppModal';
import { LogoButton } from '../../../components/LogoButton/LogoButton';
import { RootStackParamList } from '../../../constants/navigation';
import { useAuthContext } from '../../../context/AuthContext';
import { FormInput } from '../../../components/FormInput/FormInput';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getAuth, sendPasswordResetEmail } from '@react-native-firebase/auth';
import { Loader } from '../../../components/Loader/Loader';
import { useAppTheme } from '../../../App/theming';
import { getAuthErrorCode } from '../../../lib/firebaseAuthError';
import { useStyles } from './SignIn.styles';

const SIGN_IN_MESSAGES: Record<string, string> = {
  'auth/invalid-email':
    'Please check your email again, it might be badly formatted',
  'auth/user-not-found': 'Please check the entered credentials',
  'auth/wrong-password': 'Please check the entered credentials',
  'auth/too-many-requests':
    'Access to this account has been temporarily disabled, please try again later or reset its password',
};

export const SignInTab = () => {
  const [working, setWorking] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>();
  const passwordInputRef = useRef<TextInput>(null);
  const { login } = useAuthContext();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const styles = useStyles();

  const onSubmit = async () => {
    if (!email || !password) {
      setError('Please check the entered credentials');
      return;
    }

    setWorking(true);

    try {
      await login(email, password);
      nav.replace('HOME');
    } catch (e: unknown) {
      const code = getAuthErrorCode(e);
      setError(
        (code && SIGN_IN_MESSAGES[code]) ??
          'An unknown error occurred, please check your credentials and try again',
      );
      setWorking(false);
    }
  };

  const resetPassword = async () => {
    if (!email.length) {
      return setError('Please enter an email');
    }
    try {
      await sendPasswordResetEmail(getAuth(), email);
      setStatus(
        "An email has been send to the provided address if it's known to us",
      );
    } catch {
      setError('Please check the provided email again');
    }
  };

  return (
    <View style={styles.parent}>
      <AppModal
        visible={!!error}
        title="ERROR"
        titleColor={colors.error}
        titleIcon="alert-circle"
        subTitle={error}
        onDismiss={() => setError(undefined)}
      />
      <AppModal
        visible={!!status}
        title="SUCCESS"
        titleColor={colors.success}
        titleIcon="check"
        subTitle={status}
        onDismiss={() => setStatus(undefined)}
      />
      <KeyboardAwareScrollView
        resetScrollToCoords={{ x: 0, y: 0 }}
        scrollEnabled={true}
        viewIsInsideTabBar
        extraScrollHeight={80}
        extraHeight={80}
        style={styles.keyboardAwareViewWrapper}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.heading}>SIGN IN</Text>
        <FormInput
          style={styles.input}
          label={'EMAIL'}
          value={email}
          placeholder={'john@doe.com'}
          onChangeText={(val) => setEmail(val.toLowerCase())}
          autoCapitalize="none"
          returnKeyType="next"
          keyboardType="email-address"
          textContentType="emailAddress"
          onSubmitEditing={() => {
            passwordInputRef.current?.focus();
          }}
        />
        <FormInput
          style={styles.input}
          label={'PASSWORD'}
          value={password}
          onChangeText={setPassword}
          textContentType="password"
          ref={passwordInputRef}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />
        <Text style={styles.forgotPasswordLink} onPress={resetPassword}>
          Forgot password?
        </Text>
        <LogoButton style={styles.button} label="GO" onPress={onSubmit} />
      </KeyboardAwareScrollView>
      <Loader working={working} />
    </View>
  );
};
