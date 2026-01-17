import React, { FC, PropsWithChildren } from 'react';
import { StatusBar, StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../App/theming';
import { useStyles } from './styles';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FullScreenLayoutProps {
  style?: StyleProp<ViewStyle>;
  mode?: 'dark' | 'light';
  size?: 'safe' | 'fullscreen';
}

export const FullScreenLayout: FC<PropsWithChildren<FullScreenLayoutProps>> = ({
  children,
  style,
  mode = 'dark',
  size = 'safe',
}: PropsWithChildren<FullScreenLayoutProps>) => {
  const { colors } = useAppTheme();
  const styles = useStyles(size);
  if (size === 'safe') {
    return (
      <SafeAreaView
        style={[
          style,
          {
            backgroundColor:
              mode === 'dark' ? colors.background : colors.secondary,
          },
          styles.mainView,
        ]}
      >
        <StatusBar
          backgroundColor={
            mode === 'dark' ? colors.background : colors.secondary
          }
          barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        />
        {children}
      </SafeAreaView>
    );
  } else {
    return (
      <View
        style={[
          style,
          {
            backgroundColor:
              mode === 'dark' ? colors.background : colors.secondary,
          },
          styles.mainView,
        ]}
      >
        <StatusBar
          backgroundColor={
            mode === 'dark' ? colors.background : colors.secondary
          }
          barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        />
        {children}
      </View>
    );
  }
};
