import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useStyles = () => {
  const insets = useSafeAreaInsets();

  return StyleSheet.create({
    mainView: {
      height: '100%',
      width: '100%',
      paddingTop: insets.top,
    },
  });
};
