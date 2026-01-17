import { Dimensions, Platform, StyleSheet } from 'react-native';
import { useAppTheme } from '../../App/theming';

export const useStyles = () => {
  const { colors } = useAppTheme();
  const { width, height } = Dimensions.get('window');

  const textSize = Math.max(width * 0.05, 30);

  return StyleSheet.create({
    currentTurnScoreContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: height * 0.015,
      width: width * 0.8,
    },
    currentThrowContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    currentThrowNumberText: {
      fontSize: textSize * 0.5,
    },
    currentThrowNumberTextSuperScript: {
      fontSize: textSize * 0.8 * 0.4,
    },
    currentThrowScoreText: {
      paddingLeft: width * 0.02,
      fontSize: textSize,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
    },
    neededScoreText: {
      opacity: 0.5,
      fontSize: textSize * 0.5,
    },
    undoButton: {
      transform: [{ rotateZ: '45deg' }],
      backgroundColor: colors.onSurface,
      color: colors.primary,
    },
  });
};
