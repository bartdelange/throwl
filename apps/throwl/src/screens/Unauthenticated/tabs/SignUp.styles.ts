import { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useAppTheme } from '../../../App/theming';

export const useStyles = () => {
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();

  return useMemo(
    () =>
      StyleSheet.create({
        parent: {
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
        },
        keyboardAwareViewWrapper: {
          height: '100%',
        },
        content: {
          paddingHorizontal: (width - Math.min(width * 0.9, 500)) / 2,
          marginTop: '15%',
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
        },
        heading: {
          fontSize: Math.max(width * 0.1, 24),
          ...Platform.select({
            default: {
              fontWeight: 'bold',
            },
            android: {
              fontFamily: 'Karbon-Bold',
            },
          }),
          marginBottom: '10%',
          color: colors.onBackground,
        },
        subError: {
          textAlign: 'center',
          fontSize: 20,
          color: colors.primary,
          marginBottom: 10,
        },
        input: {
          marginBottom: 20,
        },
        button: {
          marginTop: height * 0.05,
        },
      }),
    [colors.onBackground, colors.primary, height, width],
  );
};
