import { StyleSheet } from 'react-native';
import { useAppTheme } from '../../App/theming';

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
    // eslint-disable-next-line react-native/no-color-literals
    transparent: {
      backgroundColor: 'transparent',
    },
  });
};
