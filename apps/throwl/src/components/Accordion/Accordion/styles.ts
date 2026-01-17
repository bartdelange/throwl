import { Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../App/theming';

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
          fontFamily: 'Karbon-Bold',
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
          fontFamily: 'Karbon-Bold',
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
