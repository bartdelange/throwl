import React, { useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/core';
import { StackNavigationProp } from '@react-navigation/stack';
import { TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import isEmail from 'validator/es/lib/isEmail';
import { AppModal } from '~/components/AppModal/AppModal';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import { RootStackParamList } from '~/constants/navigation';
import { useAuthContext } from '~/context/AuthContext';
import { FormInput } from '~/components/FormInput/FormInput';
import { Loader } from '~/components/Loader/Loader';
import { useAppTheme } from '~/App/theming.tsx';
import { getAuthErrorCode } from '~/lib/firebaseAuthError.ts';
import { useStyles } from '~/screens/Unauthenticated/tabs/SignUp.styles.ts';

type SignUpErrorMsg = { error: string; subError?: string };

const SIGN_UP_MESSAGES: Record<string, SignUpErrorMsg> = {
  'auth/invalid-email': {
    error: 'Please check your email again, it might be badly formatted',
  },
  'auth/user-not-found': {
    error: 'Please check the entered credentials',
  },
  'auth/wrong-password': {
    error: 'Please check the entered credentials',
  },
  'auth/weak-password': {
    error: 'You have entered a weak password',
    subError:
      "Strong passwords help secure your account. It's recommended to make it at least 8 characters and enter a mix of lower and uppercase characters in combination with special characters",
  },
};

const DEFAULT_SIGNUP_ERROR: SignUpErrorMsg = {
  error: 'An unknown error occurred, please check your credentials and try again',
};

export const SignUpTab = () => {
  const [working, setWorking] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [subError, setSubError] = useState<string>();
  const [modalOpen, setModalOpen] = useState<boolean>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();
  const styles = useStyles();

  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);

  const { register } = useAuthContext();

  const onSubmit = async () => {
    if (!email.length || !isEmail(email)) {
      setError('Please enter a valid email');
      setModalOpen(true);
      return;
    }

    if (!password.length || confirmPassword !== password) {
      setError('Please make sure the passwords match');
      setModalOpen(true);
      return;
    }

    if (!name.length) {
      setError('Please enter a name');
      setModalOpen(true);
      return;
    }

    setWorking(true);

    try {
      await register(email, password, name);
      nav.replace('HOME');
    } catch (e: unknown) {
      const code = getAuthErrorCode(e);

      const msg: SignUpErrorMsg = code ? SIGN_UP_MESSAGES[code] : DEFAULT_SIGNUP_ERROR;

      setError(msg.error);
      setSubError(msg.subError);
      setModalOpen(true);
      setWorking(false);
    }
  };
  return (
    <View style={styles.parent}>
      <AppModal
        visible={!!modalOpen}
        title="ERROR"
        titleColor={colors.error}
        titleIcon="alert-circle"
        subTitle={error}
        onDismiss={() => {
          setModalOpen(false);
        }}
        customContent={subError && <Text style={styles.subError}>{subError}</Text>}
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
        <Text style={styles.heading}>SIGN UP</Text>
        <FormInput
          style={styles.input}
          label={'EMAIL'}
          value={email}
          placeholder={'john@doe.com'}
          onChangeText={val => setEmail(val.toLowerCase())}
          onSubmitEditing={() => {
            passwordInputRef.current?.focus();
          }}
          returnKeyType="next"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <FormInput
          style={styles.input}
          label={'PASSWORD'}
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
          label={'CONFIRM PASSWORD'}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="password"
          ref={confirmPasswordInputRef}
          onSubmitEditing={() => {
            nameInputRef.current?.focus();
          }}
          returnKeyType="next"
        />
        <FormInput
          style={styles.input}
          label={'NAME'}
          value={name}
          ref={nameInputRef}
          onChangeText={setName}
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />
        <LogoButton style={styles.button} label="GO" onPress={onSubmit} />
      </KeyboardAwareScrollView>
      <Loader working={working} />
    </View>
  );
};
