import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useStyles = (mode: 'safe' | 'fullscreen') => {
  const insets = useSafeAreaInsets();

  return StyleSheet.create({
    mainView: {
      flex: 1,
      paddingTop: mode === 'fullscreen' ? insets.top : 0,
    },
  });
};
