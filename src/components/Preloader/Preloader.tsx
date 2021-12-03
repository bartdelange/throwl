import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { CircleSnail as ProgressCircle } from 'react-native-progress';
import { useSharedValue } from 'react-native-reanimated';
import { AppLogoLightLoader } from '~/components/AppLogo';
import { AuthContext } from '~/context/AuthContext';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { makeStyles } from './styles';

export const Preloader: React.FC<PropsWithChildren<any>> = ({
  children,
}: PropsWithChildren<any>) => {
  const [loading, setLoading] = React.useState(true);
  const [minAmountPassed, setMinAmountPassed] = React.useState(false);
  const { initializing } = React.useContext(AuthContext);
  const loaderVisible = useSharedValue(1);
  const contentVisible = useSharedValue(0);
  const styles = makeStyles();

  React.useEffect(() => {
    if (!(initializing || !minAmountPassed)) {
      setLoading(false);
      loaderVisible.value = 0;
      contentVisible.value = 1;
    }
  }, [initializing, minAmountPassed]);

  React.useEffect(() => {
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
    <View style={{ width: '100%', height: '100%' }}>{children}</View>
  );
};
