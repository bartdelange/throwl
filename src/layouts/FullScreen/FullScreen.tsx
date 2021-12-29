import React, { PropsWithChildren } from 'react';
import { SafeAreaView, StatusBar, StyleProp, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { makeStyles } from './styles';

interface FullScreenLayoutProps {
  style?: StyleProp<any>;
  mode?: 'dark' | 'light';
  size?: 'safe' | 'fullscreen';
}

export const FullScreenLayout: React.FC<
  PropsWithChildren<FullScreenLayoutProps>
> = ({
  children,
  style,
  mode = 'dark',
  size = 'safe',
}: PropsWithChildren<FullScreenLayoutProps>) => {
  const { colors } = useTheme();
  const styles = makeStyles();
  if (size === 'safe') {
    return (
      <SafeAreaView
        style={[
          style,
          {
            backgroundColor:
              mode === 'dark' ? colors.background : colors.accent,
          },
          styles.mainView,
        ]}>
        <StatusBar
          backgroundColor={mode === 'dark' ? colors.background : colors.accent}
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
              mode === 'dark' ? colors.background : colors.accent,
          },
          styles.mainView,
        ]}>
        <StatusBar
          backgroundColor={mode === 'dark' ? colors.background : colors.accent}
          barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        />
        {children}
      </View>
    );
  }
};
