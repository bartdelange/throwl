import React, { PropsWithChildren } from 'react';
import { View, Animated } from 'react-native';
import { CircleSnail as ProgressCircle } from 'react-native-progress';
import { AppLogoLightLoader } from '~/components/AppLogo';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { AuthContext } from '~/context/AuthContext';
import { makeStyles } from './styles';

let listenerId: string = '';
export const Preloader: React.FC<PropsWithChildren<any>> = ({
  children,
}: PropsWithChildren<any>) => {
  const [loading, setLoading] = React.useState(true);
  const [minAmountPassed, setMinAmountPassed] = React.useState(false);
  const { initializing } = React.useContext(AuthContext);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const styles = makeStyles();

  React.useEffect(() => {
    if (!(initializing || !minAmountPassed)) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [initializing, minAmountPassed]);

  React.useEffect(() => {
    setTimeout(() => {
      setMinAmountPassed(true);
    }, 2000);
  }, []);

  fadeAnim.removeListener(listenerId);
  listenerId = fadeAnim.addListener(({ value }) => {
    if (value === 0) {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }).start();
    }
  });

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
      }}>
      {loading ? (
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
      )}
    </Animated.View>
  );
};
