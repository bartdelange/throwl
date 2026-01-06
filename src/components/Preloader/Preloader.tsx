import React, { FC, PropsWithChildren, useEffect, useState } from 'react';
import { View } from 'react-native';
import { CircleSnail as ProgressCircle } from 'react-native-progress';
import { useSharedValue } from 'react-native-reanimated';
import { AppLogoLightLoader } from '~/components/AppLogo';
import { useAuthContext } from '~/context/AuthContext';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { useStyles } from './styles';

export const Preloader: FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [minAmountPassed, setMinAmountPassed] = useState(false);
  const { initializing } = useAuthContext();
  const loaderVisible = useSharedValue(1);
  const contentVisible = useSharedValue(0);
  const styles = useStyles();

  useEffect(() => {
    if (!(initializing || !minAmountPassed)) {
      setLoading(false);
      loaderVisible.value = 0;
      contentVisible.value = 1;
    }
  }, [contentVisible, initializing, loaderVisible, minAmountPassed]);

  useEffect(() => {
    setTimeout(() => {
      setMinAmountPassed(true);
    }, 2000);
  }, []);

  // TODO: Animate between the loading screen and content screen

  return loading ? (
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
  ) : (
    <View style={styles.loadedWrapper}>{children}</View>
  );
};
