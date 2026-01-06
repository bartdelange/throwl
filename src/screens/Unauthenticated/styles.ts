import { StyleSheet, useWindowDimensions } from 'react-native';
import { useMemo } from 'react';
import { useAppTheme } from '~/App/theming.tsx';

export const useStyles = () => {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  return useMemo(
    () =>
      StyleSheet.create({
        tabBar: {
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: '10%',
          width: '100%',
        },
        tabIcon: {
          marginHorizontal: width * 0.05,
        },
        buttonDivider: {
          width: Math.max(width * 0.005, 2),
          height: '100%',
          backgroundColor: colors.onBackground,
        },
      }),
    [colors.onBackground, width],
  );
};
