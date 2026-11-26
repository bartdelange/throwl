import { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useAppTheme } from '@throwl/shared-theme';

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
              fontFamily: 'Jost',
            },
          }),
        },
        divider: {
          height: 3,
          backgroundColor: colors.onBackground,
          marginBottom: '10%',
        },
        right: {
          alignItems: 'flex-end',
          width: '25%',
        },
      }),
    [colors.onBackground, textSize],
  );
};
