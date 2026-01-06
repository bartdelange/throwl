import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const useStyles = (textSize: number) => {
  const { height } = Dimensions.get('window');
  const { colors } = useAppTheme();

  return StyleSheet.create({
    scoreStatHeader: {
      fontSize: textSize,
      marginTop: height * 0.0125,
      marginBottom: height * 0.0125,
      color: colors.primary,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
    },
    scoreItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    scoreItemText: {
      fontSize: Math.max(textSize * 0.5, 18),
      color: colors.primary,
    },
  });
};
