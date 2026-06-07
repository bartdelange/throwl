import { StyleSheet } from 'react-native';
import { useAppTheme } from '@throwl/shared-theme';

export const useStyles = () => {
  const { colors } = useAppTheme();
  const size = 30;

  return StyleSheet.create({
    container: {
      height: size,
      width: size,
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  });
};
