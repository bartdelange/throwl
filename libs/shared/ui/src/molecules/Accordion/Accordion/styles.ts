import { Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '@throwl/shared-theme';

export const useStyles = () => {
  const { colors } = useAppTheme();

  return StyleSheet.create({
    wrapper: {
      marginTop: 16,
      backgroundColor: colors.secondary,
      borderRadius: 8,
      overflow: 'hidden',
    },
    container: {
      paddingVertical: 16,
      paddingLeft: 8,
      flexDirection: 'row',
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 16,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Jost',
        },
      }),
      flex: 2,
    },
    subtitle: {
      fontSize: 16,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Jost',
        },
      }),
    },
    content: {
      overflow: 'hidden',
      backgroundColor: colors.secondary,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
  });
};
