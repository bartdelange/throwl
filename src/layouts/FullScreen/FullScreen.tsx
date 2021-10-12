import React, { PropsWithChildren } from 'react';
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleProp,
  StyleSheet,
} from 'react-native';

interface FullScreenLayoutProps {
  style?: StyleProp<any>;
}

export const FullScreenLayout: React.FC<
  PropsWithChildren<FullScreenLayoutProps>
> = ({ children, style }: PropsWithChildren<FullScreenLayoutProps>) => {
  return (
    <SafeAreaView style={[style, styles.mainView]}>
      <StatusBar barStyle={'light-content'} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainView: {
    backgroundColor: '#02314e',
    height: '100%',
    width: '100%',
  },
});
