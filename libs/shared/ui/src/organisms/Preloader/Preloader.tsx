import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { View } from 'react-native';
import { CircleSnail as ProgressCircle } from 'react-native-progress';
import { useSharedValue } from 'react-native-reanimated';
import { AppLogoLightLoader } from '../../atoms/AppLogo';
import { FullScreenLayout } from '@throwl/shared-layouts';
import { useStyles } from './styles';

interface PreloaderProps {
  initializing: boolean;
  minTimeMs?: number;
  logo?: React.ReactNode;
}

export const Preloader: FC<PropsWithChildren<PreloaderProps>> = ({
  children,
  initializing,
  minTimeMs = 2000,
  logo,
}) => {
  const [loading, setLoading] = useState(true);
  const [minAmountPassed, setMinAmountPassed] = useState(false);
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
    const timeout = setTimeout(() => {
      setMinAmountPassed(true);
    }, minTimeMs);
    return () => clearTimeout(timeout);
  }, [minTimeMs]);

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
          {logo ?? (
            <AppLogoLightLoader style={styles.progressLogo} width={450} />
          )}
        </View>
      </View>
    </FullScreenLayout>
  ) : (
    <View style={styles.loadedWrapper}>{children}</View>
  );
};
