import React, { useRef } from 'react';
import { Dimensions, StyleSheet, View, TextInput } from 'react-native';
import { FormInput } from '../components/FormInput/FormInput';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import { AppModal } from '~/components/AppModal/AppModal';
import { AuthContext } from '~/context/AuthContext';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/core';
import { RootStackParamList } from '~/constants/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

export const SignInTab = () => {
  const [working, setWorking] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string>();
  const passwordInputRef = useRef<TextInput>(null);
  const { login } = React.useContext(AuthContext);
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const onSubmit = async () => {
    if (!email || !password) {
      setError('Please check the entered credentials');
      return;
    }

    setWorking(true);

    try {
      await login(email, password);
      nav.replace('HOME');
    } catch (e: any) {
      switch (e.code) {
        case 'auth/invalid-email':
          setError(
            'Please check your email again, it might be badly formatted'
          );
          break;
        case 'auth/user-not-found':
          setError('Please check the entered credentials');
          break;
        case 'auth/wrong-password':
          setError('Please check the entered credentials');
          break;
        case 'auth/too-many-requests':
          setError(
            "Access to this account has been temporarily disabled, please try again later or reset it's password"
          );
          break;
        default:
          setError(
            'An unknown error occurred, please check your credentials and try again'
          );
          break;
      }
      setWorking(false);
    }
  };

  return (
    <View style={styles.parent}>
      {working && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      )}
      <AppModal
        visible={!!error}
        title={'Error'}
        titleColor={colors.error}
        titleIcon="alert-circle"
        subTitle={error}
        onDismiss={() => setError(undefined)}
      />
      <View style={styles.content}>
        <Text style={styles.heading}>SIGN IN</Text>
        <FormInput
          style={styles.input}
          label={'EMAIL'}
          value={email}
          placeholder={'john@doe.com'}
          onChangeText={val => setEmail(val.toLowerCase())}
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => {
            passwordInputRef.current?.focus();
          }}
        />
        <FormInput
          style={styles.input}
          label={'PASSWORD'}
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          textContentType="password"
          ref={passwordInputRef}
          secureTextEntry
          onSubmitEditing={onSubmit}
        />
        <LogoButton style={styles.button} label="GO" onPress={onSubmit} />
      </View>
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
    maxWidth: 500,
    width: '90%',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: Math.max(Dimensions.get('window').width * 0.1, 24),
    fontWeight: '900',
    marginBottom: '10%',
    color: 'white',
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: '10%',
  },
});
