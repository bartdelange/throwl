import React, { useContext, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { CircleSnail as ProgressCircle } from 'react-native-progress';
import auth from '@react-native-firebase/auth';
import { AppLogoLightLoader } from '~/components/AppLogo';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { AuthContext } from '~/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HOME_SCREEN,
  RootStackParamList,
  UNAUTHENTICATED_SCREEN,
} from '#/navigation';

export const SplashScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setTimeout(() => {
      if (user) {
        navigation.replace(HOME_SCREEN);
      } else {
        navigation.replace(UNAUTHENTICATED_SCREEN);
      }
    }, 2 * 1000);
  }, [user]);

  return (
    <FullScreenLayout style={styles.layout}>
      <View style={styles.progressScaler}>
        <View style={styles.progressWrapper}>
          <ProgressCircle
            style={styles.progressCircle}
            size={500}
            thickness={30}
            progress={100}
            color={'white'}
          />
          <AppLogoLightLoader style={styles.progressLogo} width={450} />
        </View>
      </View>
    </FullScreenLayout>
  );
};

const styles = StyleSheet.create({
  layout: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressScaler: {
    transform: [{ scale: Dimensions.get('window').width / 2 / 500 }],
  },
  progressWrapper: {
    width: 500,
    height: 500,
    position: 'relative',
  },
  progressCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressLogo: { position: 'absolute', top: 25, left: 25 },
});
