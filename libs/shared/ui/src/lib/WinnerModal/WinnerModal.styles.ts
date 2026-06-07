import { StyleSheet } from 'react-native';
import { useAppTheme } from '@throwl/shared-theme';

export const useStyles = () => {
  const { colors } = useAppTheme();

  return StyleSheet.create({
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    undoButton: {
      transform: [{ rotateZ: '45deg' }],
      backgroundColor: colors.onSurface,
      color: colors.primary,
    },
    transparent: {
      backgroundColor: 'transparent',
    },
  });
};
