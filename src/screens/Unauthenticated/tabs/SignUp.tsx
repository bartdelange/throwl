import React from 'react';
import { useNavigation } from '@react-navigation/core';
import { StackNavigationProp } from '@react-navigation/stack';
import { Dimensions, StyleSheet, TextInput, View } from 'react-native';
import { ActivityIndicator, Portal, Text, useTheme } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import isEmail from 'validator/es/lib/isEmail';
import { AppModal } from '~/components/AppModal/AppModal';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import { RootStackParamList } from '~/constants/navigation';
import { AuthContext } from '~/context/AuthContext';
import { FormInput } from '~/components/FormInput/FormInput';
import { Loader } from '~/components/Loader/Loader';

export const SignUpTab = () => {
  const [working, setWorking] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string>();
  const [subError, setSubError] = React.useState<string>();
  const [modalOpen, setModalOpen] = React.useState<boolean>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const passwordInputRef = React.useRef<TextInput>(null);
  const confirmPasswordInputRef = React.useRef<TextInput>(null);
  const nameInputRef = React.useRef<TextInput>(null);

  const { register } = React.useContext(AuthContext);

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
    } catch (e: any) {
      switch (e.code) {
        case 'auth/invalid-email':
          setError(
            'Please check your email again, it might be badly formatted'
          );
          setSubError(undefined);
          break;
        case 'auth/user-not-found':
          setError('Please check the entered credentials');
          setSubError(undefined);
          break;
        case 'auth/wrong-password':
          setError('Please check the entered credentials');
          setSubError(undefined);
          break;
        case 'auth/weak-password':
          setError('You have entered a weak password');
          setSubError(
            "Strong passwords help secure your account. It's recomended to make it at least 8 characters and enter a mix of lower and uppercase characters in combination with special characters"
          );
          break;
        default:
          setError(
            'An unknown error occurred, please check your credentials and try again'
          );
          break;
      }
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
        customContent={
          subError && <Text style={styles.subError}>{subError}</Text>
        }
      />
      <KeyboardAwareScrollView
        resetScrollToCoords={{ x: 0, y: 0 }}
        scrollEnabled={true}
        extraScrollHeight={80}
        extraHeight={80}
        contentContainerStyle={styles.content}>
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
        <View style={styles.spacer} />
      </KeyboardAwareScrollView>
      <Loader working={working} />
    </View>
  );
};

const styles = StyleSheet.create({
  parent: {
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal:
      (Dimensions.get('window').width -
        Math.min(Dimensions.get('window').width * 0.9, 500)) /
      2,
    marginTop: '15%',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: Math.max(Dimensions.get('window').width * 0.1, 24),
    fontWeight: '900',
    marginBottom: '10%',
    color: 'white',
  },
  subError: {
    textAlign: 'center',
    fontSize: 20,
    color: '#020202',
    marginBottom: 10,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: Dimensions.get('window').height * 0.05,
  },
  spacer: {
    marginVertical: 75,
  },
});
