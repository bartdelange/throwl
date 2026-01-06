import { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useAppTheme } from '~/App/theming.tsx';

export const useStyles = () => {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const textSize = Math.max(width * 0.04, 24);

  return useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10%',
        },
        heading: {
          fontSize: textSize,
          flex: 1,
          includeFontPadding: false,
          ...Platform.select({
            default: {
              fontWeight: 'bold',
            },
            android: {
              fontFamily: 'Karbon-Bold',
            },
          }),
        },
        divider: {
          height: 3,
          backgroundColor: colors.onBackground,
          marginBottom: '10%',
        },
        right: {
          alignSelf: 'flex-end',
          height: '100%',
          width: '25%',
        },
        rightInner: {
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: [{ translateY: '-50%' }],
        },
      }),
    [colors.onBackground, textSize],
  );
};
