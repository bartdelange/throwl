import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const useStyles = () => {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  const textSize = Math.max(width * 0.05, 30);
  const dartboardWidth = width < 500 ? '100%' : width * 0.8;

  return StyleSheet.create({
    layout: {
      flexDirection: 'column',
      alignContent: 'center',
      alignItems: 'center',
    },
    backButton: { position: 'absolute', top: 0, left: 0 },
    content: { flex: 1, width: '100%' },
    dartboardWrapper: {
      padding: width * 0.025,
      aspectRatio: 1,
      width: dartboardWidth,
      position: 'relative',
      alignSelf: 'center',
    },
    missText: {
      position: 'absolute',
      right: width * 0.025,
      bottom: width * 0.025,
      color: colors.primary,
      ...Platform.select({
        default: {
          fontWeight: 'bold',
        },
        android: {
          fontFamily: 'Karbon-Bold',
        },
      }),
      fontSize: textSize,
      height: textSize,
      includeFontPadding: false,
    },
    scoreWrapper: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopStartRadius: 25,
      borderTopEndRadius: 25,
      alignItems: 'center',
      // minHeight: scoreWrapperHeight,
    },
    undoButton: {
      transform: [{ rotateZ: '45deg' }],
      backgroundColor: colors.onSurface,
      color: colors.primary,
    },
  });
};
